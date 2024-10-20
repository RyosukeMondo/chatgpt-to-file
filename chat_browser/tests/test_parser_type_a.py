# test_parser_type_a.py
import json
import logging
from components.parsers.parser_type_a import ParserTypeA


def test_parser():
    with open('test_message.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

    parser = ParserTypeA()
    parsed_json = parser.parse(html_content)
    logging.debug(json.dumps(parsed_json, indent=2))


if __name__ == "__main__":
    test_parser()
