import React, { useState } from "react";
import { Send, Smile, Paperclip } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";

interface MessageInputProps {
  newMessage: string;
  onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  onMessageChange,
  onSendMessage,
  onTyping,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);
  const [emojiButtonRef, setEmojiButtonRef] =
    useState<HTMLButtonElement | null>(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState<
    { top: number; left: number; transform?: string } | undefined
  >();

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission or other default behavior
      onSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    // Get current cursor position
    const cursorPosition = inputRef?.selectionStart || newMessage.length;

    // Insert emoji at cursor position
    const newValue =
      newMessage.slice(0, cursorPosition) +
      emoji +
      newMessage.slice(cursorPosition);

    // Create a synthetic event to add the emoji to the input
    const syntheticEvent = {
      target: {
        value: newValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onMessageChange(syntheticEvent);

    // Set cursor position after the emoji
    setTimeout(() => {
      if (inputRef) {
        inputRef.focus();
        inputRef.setSelectionRange(
          cursorPosition + emoji.length,
          cursorPosition + emoji.length
        );
      }
    }, 0);

    // Keep the emoji picker open for multiple selections
    // setShowEmojiPicker(false);
  };

  const handleEmojiButtonClick = () => {
    if (emojiButtonRef) {
      const rect = emojiButtonRef.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const pickerWidth = 400; // Approximate width of the emoji picker
      const pickerHeight = 400; // Approximate height of the emoji picker

      // Calculate left position to center the picker above the button
      let left = rect.left + rect.width / 2 - pickerWidth / 2;

      // Ensure the picker doesn't go off the left edge
      if (left < 16) {
        left = 16;
      }

      // Ensure the picker doesn't go off the right edge
      if (left + pickerWidth > viewportWidth - 16) {
        left = viewportWidth - pickerWidth - 16;
      }

      // Calculate top position - try above first, then below if not enough space
      let top = rect.top - 20;
      let transform = "translateY(-100%)";

      // If not enough space above, position below the button
      if (top - pickerHeight < 16) {
        top = rect.bottom + 20;
        transform = "translateY(0)";
      }

      setEmojiPickerPosition({
        top: top,
        left: left,
        transform: transform,
      });
    }
    setShowEmojiPicker(true);
  };

  return (
    <div className="p-3 md:p-4 bg-white border-t border-gray-200 flex-shrink-0">
      <div className="flex items-center space-x-2 md:space-x-3">
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <div className="flex-1 relative">
          <input
            ref={setInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              onMessageChange(e);
              onTyping(e);
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <button
          ref={setEmojiButtonRef}
          onClick={handleEmojiButtonClick}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Add emoji"
        >
          <Smile className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button
          onClick={onSendMessage}
          disabled={!newMessage.trim()}
          className="p-2 text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <Send className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
          position={emojiPickerPosition}
        />
      )}
    </div>
  );
};
