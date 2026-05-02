# listening
General listening exercises: play an audio clip and choose what was said.

Schema

- `id` (string)
- `type`: "listening"
- `audio` (string): path to audio
- `question` (object): localized prompt
- `options` (array): each option contains `text` (localized with `bengali`, `romanized`, `en`, `ja`) and `correct` boolean
- `hint` (object, optional)

Example

```json
{
	"id": "ex6_listening",
	"type": "listening",
	"audio": "assets/audio/listening/lesson1_listening1.m4a",
	"question": { "en": "Listen to the audio and select what was said." },
	"options": [
		{ "text": { "bengali": "হ্যালো, আপনার সাথে পরিচিত হয়ে ভালো লাগলো", "en": "Hello, nice to meet you" }, "correct": true },
		{ "text": { "bengali": "আমি ভালো আছি", "en": "I am fine" }, "correct": false }
	]
}
```
Audio comprehension exercise.
