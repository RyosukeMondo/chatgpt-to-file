# components/parsers/code_snippet_sub_parser.py
from .base_sub_parser import BaseSubParser
import logging


class CodeSnippetSubParser(BaseSubParser):
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)

    def can_parse(self, element) -> bool:
        return element.name == 'pre'

    def parse(self, element) -> dict:
        # Extract language
        language_div = element.find('div', class_=lambda x: x and 'language-' in x)
        if language_div:
            language = language_div.get_text(strip=True)
        else:
            # Fallback to class names in <code>
            code_tag = element.find('code')
            if code_tag and any(cls.startswith('language-') for cls in code_tag.get('class', [])):
                language = next(cls.split('language-')[1]
                                for cls
                                in code_tag.get('class', [])
                                if cls.startswith('language-'))
            else:
                language = 'plaintext'

        # Extract code
        code_tag = element.find('code')
        code = code_tag.get_text() if code_tag else ''

        # Extract description: Look for the previous sibling <p> tag
        description = ''
        prev_sibling = element.find_previous_sibling()
        while prev_sibling:
            if prev_sibling.name == 'p':
                description = prev_sibling.get_text(strip=True)
                break
            prev_sibling = prev_sibling.find_previous_sibling()

        # Extract title from description if possible
        if description and ':' in description:
            title, desc = description.split(':', 1)
            title = title.strip()
            desc = desc.strip()
        else:
            title = 'Code Snippet'
            desc = description

        is_complete_code = "existing code" not in code
        include_full_path = " Path: " in code

        self.logger.info("Successfully parsed a code snippet.")
        return {
            "type": "code_snippet",
            "title": title if title else "Code Snippet",
            "description": desc,
            "language": language,
            "code": code,
            "is_complete_code": is_complete_code,
            "include_full_path": include_full_path
        }
