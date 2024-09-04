import { h } from "preact";
import { useState } from "preact/hooks";
import { Button } from "@create-figma-plugin/ui";

interface CopyButtonProps {
  content: string;
}

const CopyButton = ({ content }: CopyButtonProps) => {
  const [buttonText, setText] = useState("Copy");

  const handleCopy = () => {
    // Check if Clipboard API is available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content)
        .then(() => {
          setText("Copied!");
          setTimeout(() => {
            setText("Copy");
          }, 1000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
        });
    } else {
      // Fallback approach using textarea
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);

      setText("Copied!");
      setTimeout(() => {
        setText("Copy");
      }, 1000);
    }
  };

  return (
    <Button onClick={handleCopy}>
      {buttonText}
    </Button>
  );
};

export default CopyButton;