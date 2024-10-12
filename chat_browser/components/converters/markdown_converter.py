from .base_converter import BaseConverter


class MarkdownConverter(BaseConverter):
    def can_convert(self, format_type: str) -> bool:
        return format_type.lower() == 'markdown'

    def convert(self, content_dict: dict) -> str:
        markdown = ""
        if content_dict.get("type") == "code_list":
            for item in content_dict.get("items", []):
                markdown += f"### {item.get('title')}\n"
                markdown += f"{item.get('description')}\n\n"
                markdown += f"```{item.get('language')}\n{item.get('code')}\n```\n\n"
        return markdown
