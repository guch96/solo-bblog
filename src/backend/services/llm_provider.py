"""LLM Provider 抽象层 — 支持多 LLM 厂商切换"""
import os
import json
import logging
from abc import ABC, abstractmethod
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


class OpenAIProvider(LLMProvider):
    """OpenAI API 实现"""

    def __init__(self, model: str = "gpt-4o-mini"):
        super().__init__(model)

    def analyze(self, records: list[dict], date_from: str, date_to: str) -> dict:
        """调用 OpenAI API 进行健康分析"""
        from openai import OpenAI

        logger.info("OpenAI 分析开始: 记录数=%d 时间范围=%s~%s 模型=%s",
                    len(records), date_from, date_to, self.model)

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        records_json = json.dumps(records, ensure_ascii=False, default=str)

        system_prompt = """你是一位专业的肠道健康专家。请根据用户的如厕记录数据，从以下维度分析肠道健康状况：
1. 排便频率是否正常
2. 布里斯托大便分类法形状分布是否健康
3. 是否有异常情况需要关注（颜色异常、持续腹泻/便秘等）
4. 提供具体的饮食和生活习惯建议

请用 JSON 格式回复，包含以下字段：
- summary: 一段话总结整体状况（中文）
- suggestions: 健康建议列表，每个建议是一句话（中文数组）"""

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"分析时间范围：{date_from} 至 {date_to}\n\n记录数据：\n{records_json}"},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        result = json.loads(response.choices[0].message.content)
        logger.info("OpenAI 分析完成: tokens=%d", response.usage.total_tokens)

        return {
            "summary": result.get("summary", ""),
            "suggestions": result.get("suggestions", []),
            "model": self.model,
            "provider": "openai",
        }


class MockOpenAIProvider(LLMProvider):
    """模拟 Provider — 仅用于测试"""
    def __init__(self, model: str = "mock-model"):
        super().__init__(model)

    def analyze(self, records: list[dict], date_from: str, date_to: str) -> dict:
        return {
            "summary": f"测试摘要：分析了 {len(records)} 条记录，您的肠道健康状况良好。",
            "suggestions": ["多喝水", "多吃纤维食物", "保持规律运动"],
            "model": self.model,
            "provider": "mock_provider",
        }


def get_provider() -> LLMProvider:
    """工厂函数：根据环境变量 LLM_PROVIDER 返回对应的 Provider 实例"""
    provider_name = os.getenv("LLM_PROVIDER", "openai")
    logger.info("初始化 LLM Provider: %s", provider_name)

    if provider_name == "openai":
        return OpenAIProvider()
    else:
        logger.warning("未知 LLM Provider '%s'，回退到 OpenAI", provider_name)
        return OpenAIProvider()
