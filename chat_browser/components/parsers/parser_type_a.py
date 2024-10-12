# components/parsers/parser_type_a.py
from typing import Any
from .base_parser import BaseParser
from bs4 import BeautifulSoup


class ParserTypeA(BaseParser):
    def parse(self, html_content: str) -> dict:
        soup = BeautifulSoup(html_content, 'html.parser')
        message_div = soup.find('div', {'data-message-author-role': True})
        if not message_div:
            return {}  # Not suitable for this parser

        # Extract message attributes
        author_role = message_div.get('data-message-author-role', '')
        message_id = message_div.get('data-message-id', '')
        model_slug = message_div.get('data-message-model-slug', '')

        # Initialize content
        content: dict[str, Any] = {
            "type": "code_list",
            "items": []
        }

        # Find all <pre> tags within the message
        pre_tags = message_div.find_all('pre')
        for pre in pre_tags:
            # Extract language from the relevant div or class
            language_div = pre.find('div', class_=lambda x: x and 'language-' in x)
            if language_div:
                language = language_div.get_text(strip=True)
            else:
                # Fallback: Try to extract language from class names
                code_tag = pre.find('code')
                if code_tag and 'language-' in code_tag.get('class', []):
                    classes = code_tag.get('class', [])
                    language = next((cls.split('language-')[1] for cls in classes if cls.startswith('language-')), 'plaintext')
                else:
                    language = 'plaintext'  # Default language

            # Extract code from <code> tag
            code_tag = pre.find('code')
            if code_tag:
                code = code_tag.get_text()
            else:
                code = ''

            # Extract description: Look for the previous sibling <p> tag
            description = ''
            prev_sibling = pre.find_previous_sibling()
            while prev_sibling:
                if prev_sibling.name == 'p':
                    description = prev_sibling.get_text(strip=True)
                    break
                prev_sibling = prev_sibling.find_previous_sibling()

            # Extract title from description if possible
            # Assuming the description starts with the title followed by a colon
            if description and ':' in description:
                title, desc = description.split(':', 1)
                title = title.strip()
                desc = desc.strip()
            else:
                title = 'Code Snippet'
                desc = description

            # Append the extracted information to items
            if code:  # Only add if there is code
                item = {
                    "title": title if title else "Code Snippet",
                    "description": desc,
                    "language": language,
                    "code": code
                }
                content["items"].append(item)

        message = {
            "message": {
                "author_role": author_role,
                "id": message_id,
                "model_slug": model_slug,
                "content": content
            }
        }

        return message
