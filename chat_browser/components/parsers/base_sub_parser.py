from abc import ABC, abstractmethod


class BaseSubParser(ABC):
    @abstractmethod
    def can_parse(self, element) -> bool:
        """Determine if the sub-parser can handle the given HTML element."""
        pass

    @abstractmethod
    def parse(self, element) -> dict:
        """Parse the given HTML element and return the extracted data."""
        pass
