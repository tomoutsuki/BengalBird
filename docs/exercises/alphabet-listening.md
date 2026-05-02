# alphabet_listening
Letter-recognition listening exercise.

Schema

- `id` (string): unique exercise id
- `type`: "alphabet_listening"
- `audio` (string): path to audio file
- `question` (object): localized prompt (e.g. `{ "en": "Which letter did you hear?" }`)
- `options` (array): list of option objects with:
	- `letter` (string)
	- `romanized` (string)
	- `correct` (boolean)

Example

```json
{
	"id": "l1_ex2",
	"type": "alphabet_listening",
	"audio": "assets/audio/alphabet/ম.mp3",
	"question": { "en": "Which letter did you hear?", "ja": "どの文字が聞こえましたか？" },
	"options": [
		{ "letter": "ম", "romanized": "m", "correct": true },
		{ "letter": "আ", "romanized": "a", "correct": false },
		{ "letter": "অ", "romanized": "ô", "correct": false },
		{ "letter": "ল", "romanized": "l", "correct": false }
	]
}
```
