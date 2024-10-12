# components/converters/base_converter.py
from abc import ABC, abstractmethod

class BaseConverter(ABC):
    @abstractmethod
    def can_convert(self, format_type: str) -> bool:
        pass

    @abstractmethod
    def convert(self, content_dict: dict) -> str:
        pass
