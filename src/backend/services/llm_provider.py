"""LLM Provider 抽象层 — 支持 OpenAI 兼容协议的任意 LLM 厂商"""
import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Generator
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """LLM Provider 抽象基类"""

    def __init__(self, model: str):
        self.model = model

    @abstractmethod
    def analyze(self, records: list[dict], date_from: str, date_to: str) -> dict:
        """
        分析记录数据并返回健康建议。
        返回: {"summary": str, "suggestions": list[str], "model": str, "provider": str}
        """
        ...

    @abstractmethod
    def analyze_stream(self, records: list[dict], date_from: str, date_to: str) -> Generator[str, None, None]:
        """
        流式分析，逐 token yield SSE 格式数据。
        yield 格式:
          - "data: {\"type\":\"summary_chunk\",\"content\":\"...\"}\n\n"
          - "data: {\"type\":\"suggestions\",\"content\":[...]}\n\n"
          - "data: {\"type\":\"done\"}\n\n"
        """
        ...


class OpenAICompatibleProvider(LLMProvider):
    """OpenAI 兼容协议 Provider — 支持 OpenAI / DeepSeek / Qwen / GLM 等"""

    def __init__(self):
        super().__init__(os.getenv("LLM_MODEL", "gpt-4o-mini"))
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))
        self.max_tokens = int(os.getenv("LLM_MAX_TOKENS", "2048"))
        self.provider_name = os.getenv("LLM_PROVIDER_NAME", "openai")

    def _build_client(self):
        from openai import OpenAI
        return OpenAI(api_key=self.api_key, base_url=self.base_url)

    def _system_prompt(self) -> str:
        return """你是一位专业的肠道健康专家。请根据用户的如厕记录数据，从以下维度分析肠道健康状况：
1. 排便频率是否正常
2. 布里斯托大便分类法形状分布是否健康
3. 排便过程感受是否存在异常（顺畅度、急迫感、费力程度等）
4. 身体感受是否有需要关注的信号
5. 是否有异常情况需要关注（颜色异常、持续腹泻/便秘等）
6. 提供具体的饮食和生活习惯建议

请用以下格式回复：
先输出一段中文分析摘要（纯文本），然后在摘要末尾换行后输出分隔符 ---SUGGESTIONS---，再输出包含 suggestions 字段的 JSON 数组。
JSON 格式：{"suggestions": ["建议1", "建议2", ...]}"""

    def _build_records_json(self, records: list[dict]) -> str:
        return json.dumps(records, ensure_ascii=False, default=str)

    def analyze(self, records: list[dict], date_from: str, date_to: str) -> dict:
        """同步分析（非流式）"""
        logger.info("分析开始: 记录数=%d 时间范围=%s~%s 模型=%s",
                    len(records), date_from, date_to, self.model)

        client = self._build_client()
        records_json = self._build_records_json(records)

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self._system_prompt()},
                {"role": "user", "content": f"分析时间范围：{date_from} 至 {date_to}\n\n记录数据：\n{records_json}"},
            ],
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )

        content = response.choices[0].message.content
        if content is None:
            logger.warning("LLM 返回空 content，total_tokens=%d finish_reason=%s",
                          response.usage.total_tokens if response.usage else 0,
                          response.choices[0].finish_reason)
            return {
                "summary": "",
                "suggestions": [],
                "model": self.model,
                "provider": self.provider_name,
            }
        result = self._parse_response(content)
        logger.info("分析完成: tokens=%d", response.usage.total_tokens)

        return {
            "summary": result["summary"],
            "suggestions": result["suggestions"],
            "model": self.model,
            "provider": self.provider_name,
        }

    def analyze_stream(self, records: list[dict], date_from: str, date_to: str) -> Generator[str, None, None]:
        """流式分析，逐 token 推送 SSE 事件"""
        logger.info("流式分析开始: 记录数=%d 时间范围=%s~%s 模型=%s",
                    len(records), date_from, date_to, self.model)

        client = self._build_client()
        records_json = self._build_records_json(records)

        stream = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self._system_prompt()},
                {"role": "user", "content": f"分析时间范围：{date_from} 至 {date_to}\n\n记录数据：\n{records_json}"},
            ],
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            stream=True,
        )

        buffer = ""
        summary_done = False
        summary_streamed_len = 0  # 已逐 token 推送的摘要长度，用于避免重复推送

        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                buffer += delta.content

                # 检查是否遇到了分隔符
                if "---SUGGESTIONS---" in buffer:
                    idx = buffer.index("---SUGGESTIONS---")
                    # 只推送尚未通过 token 流送出的尾部（分隔符所在 chunk 中分隔符之前的部分）
                    if not summary_done:
                        new_tail = buffer[:idx][summary_streamed_len:]
                        if new_tail:
                            yield f"data: {json.dumps({'type': 'summary_chunk', 'content': new_tail})}\n\n"
                        summary_done = True
                    # 切换 buffer 为分隔符后的内容
                    buffer = buffer[idx + len("---SUGGESTIONS---"):]
                else:
                    if not summary_done:
                        yield f"data: {json.dumps({'type': 'summary_chunk', 'content': delta.content})}\n\n"
                        summary_streamed_len += len(delta.content)

        # 流结束后解析剩余 buffer 中的 suggestions JSON
        try:
            suggestions_data = json.loads(buffer.strip())
            suggestions = suggestions_data.get("suggestions", [])
        except (json.JSONDecodeError, AttributeError):
            suggestions = []

        yield f"data: {json.dumps({'type': 'suggestions', 'content': suggestions}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        logger.info("流式分析完成")

    def _parse_response(self, content: str) -> dict:
        """解析 LLM 响应，分离摘要和建议"""
        if "---SUGGESTIONS---" in content:
            idx = content.index("---SUGGESTIONS---")
            summary = content[:idx].strip()
            json_part = content[idx + len("---SUGGESTIONS---"):].strip()
        else:
            summary = content
            json_part = "{}"

        try:
            suggestions_data = json.loads(json_part)
            suggestions = suggestions_data.get("suggestions", [])
        except json.JSONDecodeError:
            suggestions = []

        return {"summary": summary, "suggestions": suggestions}


def get_provider() -> LLMProvider:
    """工厂函数：返回 OpenAI 兼容 Provider 实例"""
    logger.info("初始化 LLM Provider: model=%s base_url=%s",
                os.getenv("LLM_MODEL", "gpt-4o-mini"),
                os.getenv("LLM_BASE_URL", "https://api.openai.com/v1"))
    return OpenAICompatibleProvider()
