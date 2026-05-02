# conversation
Short dialogue scenarios where the learner chooses the best response.

Schema

- `id` (string)
- `type`: "conversation"
- `scenario` (object, optional): localized description of the situation
- `dialogue` (array): lines of the dialogue. Each item:
	- `speaker` (string)
	- `text` (object): may contain `bengali`, `romanized`, `en`, `ja`
- `question` (object): localized prompt for the response selection
- `options` (array): each option has `text` (localized) and `correct` (boolean)
- `hint` (object, optional)

Example

```json
{
	"id": "ex5_conversation",
	"type": "conversation",
	"scenario": { "en": "You meet someone for the first time." },
	"dialogue": [
		{ "speaker": "Person", "text": { "bengali": "নমস্কার! আপনার নাম কী?", "romanized": "Nomoshkar! Apnar nam ki?", "en": "Hello! What is your name?" } }
	],
	"question": { "en": "Choose the best response:" },
	"options": [
		{ "text": { "bengali": "নমস্কার! আমার নাম সারা।", "en": "Hello! My name is Sara." }, "correct": true },
		{ "text": { "bengali": "আমি ভালো আছি।", "en": "I am fine." }, "correct": false }
	]
}
```
