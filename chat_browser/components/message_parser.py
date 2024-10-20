# components/message_parser.py
import logging
import os
import json
from chat_browser.components.parsers.parser_type_a import ParserTypeA


class MessageParser:
    def __init__(self):
        self.parsers = [ParserTypeA()]  # Add more parsers as needed

    def parse(self, html_content):
        for parser in self.parsers:
            try:
                parsed = parser.parse(html_content)
                if parsed:
                    return parsed
            except Exception as e:
                logging.error(f"Error occurred while parsing with {parser.__class__.__name__}: {e}")
                continue
        raise ValueError("No suitable parser found for the given HTML content.")

    def parse_and_save(self, html_file, parsed_path):
        filename = os.path.basename(html_file)
        parsed_file = os.path.join(parsed_path, f"{os.path.splitext(filename)[0]}.json")
        if os.path.exists(parsed_file):
            logging.warning(f"Parsed file {parsed_file} already exists. Skipping.")
            return

        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        parsed_json = self.parse(html_content)
        os.makedirs(parsed_path, exist_ok=True)
        with open(parsed_file, 'w', encoding='utf-8') as f:
            json.dump(parsed_json, f, indent=2)
