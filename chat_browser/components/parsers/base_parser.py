from abc import ABC, abstractmethod


class BaseParser(ABC):
    @abstractmethod
    def parse(self, html_content: str) -> dict:
        pass
