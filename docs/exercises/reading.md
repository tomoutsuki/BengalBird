# reading
Reading / passage exercises. Present localized passages and optional comprehension prompts.

Schema

- `id` (string)
- `type`: "reading"
- `passage` (object): localized passage fields such as `bengali`, `romanized`, `en`, `ja`
- `question` (object, optional): comprehension question
- `options` (array, optional): multiple-choice answers with `text` and `correct`
- `hint` (object, optional)

Example

```json
{
	"id": "ex4_reading",
	"type": "reading",
	"passage": {
		"bengali": "জল",
		"romanized": "jol",
		"en": "Water"
	},
	"question": { "en": "What does this word mean?" },
	"options": [ { "text": { "en": "Water" }, "correct": true }, { "text": { "en": "Mango" }, "correct": false } ]
}
```
Reading comprehension exercise.
