import os
import logging


class PythonHandler:
    """
    Handler for Python files.
    """

    COMMENT_PREFIX = '# Path: '

    def process_content(self, content, base_path, overwrite):
        """
        Processes the content by extracting the path from the first comment line and
        returns the processed content and the final path to save.

        Args:
            content (str): The original file content.
            base_path (str): The base path derived from the original file path.
            overwrite (bool): Whether to overwrite existing files.

        Returns:
            tuple: (processed_content, final_path)
        """
        lines = content.splitlines()
        if not lines:
            logging.error("Content is empty.")
            return None, None

        first_line = lines[0].strip()
        if first_line.startswith(self.COMMENT_PREFIX):
            path = first_line[len(self.COMMENT_PREFIX):].strip()
            final_path = path
            # Remove the first line and any subsequent blank lines
            processed_lines = lines[1:]
            while processed_lines and not processed_lines[0].strip():
                processed_lines.pop(0)
            processed_content = '\n'.join(processed_lines).strip()
        else:
            # If no path comment, use the provided base_path
            final_path = base_path + '.py'
            processed_content = content.strip()

        # Handle overwrite logic
        final_path = self.handle_overwrite(final_path, overwrite)

        processed_content += '\n'
        return processed_content, final_path

    def handle_overwrite(self, path, overwrite):
        """
        Determines the final path based on the overwrite flag.

        Args:
            path (str): The desired file path.
            overwrite (bool): Whether to overwrite existing files.

        Returns:
            str: The final file path.
        """
        if overwrite:
            return path
        base, extension = os.path.splitext(path)
        counter = 1
        final_path = path
        while os.path.exists(final_path):
            final_path = f"{base}({counter}){extension}"
            counter += 1
        return final_path


# Example Usage:
if __name__ == "__main__":
    handler = PythonHandler()
    sample_content = """# Path: Z:/home/user/project/app.py

print('Hello, Python World!')
"""
    processed_content, final_path = handler.process_content(sample_content, "app/app.py", overwrite=True)
    logging.debug("Processed Content:\n", processed_content)
    logging.info("Final Path:", final_path)
