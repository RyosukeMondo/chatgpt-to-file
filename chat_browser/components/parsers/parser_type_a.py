import json
from bs4 import BeautifulSoup, Tag
from .base_parser import BaseParser
from .code_snippet_sub_parser import CodeSnippetSubParser
from .project_structure_sub_parser import ProjectStructureSubParser


class ParserTypeA(BaseParser):
    def __init__(self, config_path='parsers_config.json'):
        self.sub_parsers = []
        self.load_sub_parsers(config_path)

    def load_sub_parsers(self, config_path):
        with open(config_path, 'r') as f:
            config = json.load(f)
        for sub_parser_class in config.get('sub_parsers', []):
            if sub_parser_class == 'CodeSnippetSubParser':
                self.sub_parsers.append(CodeSnippetSubParser())
            elif sub_parser_class == 'ProjectStructureSubParser':
                self.sub_parsers.append(ProjectStructureSubParser())

    def parse(self, html_content: str) -> dict:
        soup = BeautifulSoup(html_content, 'html.parser')
        message_div = soup.find('div', {'data-message-author-role': True})
        if not message_div:
            return {}  # Not suitable for this parser

        # Extract message attributes
        author_role = message_div['data-message-author-role'] if message_div and message_div.name else ''
        message_id = message_div['data-message-id'] if isinstance(message_div, Tag) else ''
        model_slug = message_div['data-message-model-slug'] if isinstance(message_div, Tag) else ''

        path_div = soup.find('path')
        if path_div:
            path = path_div.text.strip()

        # Initialize content
        content = {
            "type": ["mixed_content"],
            "items": []
        }

        # Iterate through all <pre> tags within the message
        if isinstance(message_div, Tag):
            for pre in message_div.find_all('pre'):
                for sub_parser in self.sub_parsers:
                    if sub_parser.can_parse(pre):
                        parsed_data = sub_parser.parse(pre)
                        if parsed_data:
                            content["items"].append(parsed_data)
                        break  # Move to the next <pre> after a successful parse

        # Optionally, handle other content types like text, images, etc.

        message = {
            "message": {
                "path": path,
                "author_role": author_role,
                "id": message_id,
                "model_slug": model_slug,
                "content": content
            }
        }

        return message
