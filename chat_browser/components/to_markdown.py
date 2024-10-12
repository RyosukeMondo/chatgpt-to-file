from chat_browser.components.converters import load_converters


class ConverterManager:
    def __init__(self):
        self.converters = load_converters()

    def convert(self, content_dict, format_type='markdown'):
        for converter in self.converters:
            if converter.can_convert(format_type):
                return converter.convert(content_dict)
        raise ValueError(f"No converter found for format type: {format_type}")
