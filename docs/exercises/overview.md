
# Exercise Types

- grammar-sort
- grammar-select
- grammar-write
- reading
- conversation
- listening
- alphabet_listening
- writing_keyboard
- conversation_listening
- figure_choice

Summary

Each lesson JSON (`data/*.json`) contains an `exercises` array. Supported exercise `type` values and their purpose:

- `alphabet_listening`: letter recognition from audio (see alphabet-listening.md)
- `figure_choice`: choose the image matching a Bengali word (see figure-choice.md)
- `writing_keyboard`: type words using the on-screen keyboard (see writing-keyboard.md)
- `reading`: reading passages and comprehension (see reading.md)
- `conversation`: short dialogue with response selection (see conversation.md)
- `conversation_listening`: multi-line audio scenes with choice points (see conversation-listening.md)
- `listening`: single audio clip multiple-choice (see listening.md)
- `grammar-select`: multiple-choice grammar/vocabulary (see grammar-select.md)
- `grammar-sort`: reorder words to form correct sentences (see grammar-sort.md)
- `grammar-write`: free-text/short-answer writing (see grammar-write.md)

When authoring exercises, mirror the field names shown in the examples on each exercise page. The project uses localized objects for prompts and labels (`en`, `ja`, etc.) and either index-based `correctIndex` or `correct: true` flags on option objects.
