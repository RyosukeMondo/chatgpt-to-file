import os
import logging

class PHPHandler:
    """
    Handler for PHP files.
    """

    COMMENT_PREFIX = '// Path: '

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

        # PHP starts with <?php, so the path comment is likely the second line
        if not lines[0].strip().startswith("<?php"):
            logging.error("PHP file does not start with <?php")
            return None, None

        if len(lines) < 2:
            logging.error("PHP file does not contain a path comment.")
            return None, None

        second_line = lines[1].strip()
        if second_line.startswith(self.COMMENT_PREFIX):
            path = second_line[len(self.COMMENT_PREFIX):].strip()
            final_path = path
            # Remove the first two lines and any subsequent blank lines
            processed_lines = lines[2:]
            while processed_lines and not processed_lines[0].strip():
                processed_lines.pop(0)
            processed_content = '\n'.join(processed_lines).strip()
        else:
            # If no path comment, use the provided base_path
            final_path = base_path + '.php'
            processed_content = content.strip()

        # Handle overwrite logic
        final_path = self.handle_overwrite(final_path, overwrite)

        # Prepend the path as a comment after <?php
        processed_content = f"<?php\n\n{processed_content}"

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
    handler = PHPHandler()
    sample_content = """<?php
// Path: Z:/home/user/project/app.php

echo 'Hello, PHP World!';
"""
    processed_content, final_path = handler.process_content(sample_content, "app/app.php", overwrite=True)
    print("Processed Content:\n", processed_content)
    print("Final Path:", final_path)
