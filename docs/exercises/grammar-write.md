# grammar-write
Free-text grammar / short-answer writing exercise.

Schema

- `id` (string)
- `type`: "grammar-write"
- `question` (object): localized prompt
- `correctAnswer` (string): expected Bengali answer
- `romanized` (string, optional)
- `acceptableAnswers` (array of strings, optional)
- `hint` (object, optional)

Example

```json
{
	"id": "ex3_grammar_write",
	"type": "grammar-write",
	"question": { "en": "Write the Bengali word for \"Thank you\"." },
	"correctAnswer": "ধন্যবাদ",
	"romanized": "Dhonnobad",
	"acceptableAnswers": ["ধন্যবাদ", "ধন্যবাদ।"],
	"hint": { "en": "It starts with ধ (dho)." }
}
```
