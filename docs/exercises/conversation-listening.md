# conversation_listening
Conversation-listening exercises present a short multi-line audio scene and ask the learner to choose responses at key moments.

Schema

- `id` (string)
- `type`: "conversation_listening"
- `scenario` (object): localized brief describing the situation
- `lines` (array): ordered entries making up the scene. Each entry can be:
	- `line`: spoken line with `speaker`, `bengali`, `romanized`, `translation` (localized), and optional `audio` path
	- `choice`: an interaction point with `question` (localized) and `options` (array of `text` objects, each with `bengali`, `romanized`, `en`, `ja`, and `correct` boolean)

Example (trimmed)

```json
{
	"id": "ex1_conv_listen",
	"type": "conversation_listening",
	"scenario": { "en": "Listen to a morning conversation.", "ja": "朝の会話を聞いてください。" },
	"lines": [
		{ "type": "line", "speaker": "Nasrin", "bengali": "শুভ সকাল।", "romanized": "Shubho shokal.", "translation": { "en": "Good morning." }, "audio": "assets/audio/listening/..mp3" },
		{ "type": "choice", "question": { "en": "How do you respond?" }, "options": [ { "text": { "bengali": "শুভ সকাল।", "romanized": "Shubho shokal.", "en": "Good morning." }, "correct": true }, { "text": { "bengali": "ধন্যবাদ।", "en": "Thank you." }, "correct": false } ] }
	]
}
```
