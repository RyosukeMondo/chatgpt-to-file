from bs4 import BeautifulSoup
from .base_sub_parser import BaseSubParser


class ProjectStructureSubParser(BaseSubParser):
    def can_parse(self, element) -> bool:
        # Assuming project structure is within a <pre> tag containing a tree-like structure
        return element.name == 'pre' and '├──' in element.get_text()

    def parse(self, element) -> dict:
        project_text = element.get_text()
        # Convert the project structure text into a hierarchical JSON format
        # This is a simplistic parser; for complex structures, consider using a dedicated library
        lines = project_text.strip().split('\n')
        root: dict[str, list] = {}
        stack = [(0, root)]

        for line in lines:
            indent = len(line) - len(line.lstrip(' '))
            name = line.strip(' ├──└').strip()
            node = {"name": name, "children": []}

            while stack and indent <= stack[-1][0]:
                stack.pop()

            if stack:
                stack[-1][1]["children"].append(node)
            else:
                root = node

            stack.append((indent, node))

        return {
            "type": "project_structure",
            "structure": root
        }
