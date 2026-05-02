# grammar-select
Multiple-choice grammar / vocabulary selection.

Schema

- `id` (string)
- `type`: "grammar-select"
- `question` (object): localized prompt
- `bengali` / `bengali` (string, optional): target word/phrase
- `romanized` (string, optional)
- `options` (array): each option may be one of two shapes seen in data:
	- `{ "text": { "en": ..., "ja": ... }, "correct": true|false }` (localized labels)
	- `{ "bn": "..." }` (simple Bengali string)
- `correctIndex` (number) or options may include `correct: true`
- `hint` (object, optional)

Example

```json
{
	"id": "l3_ex5",
	"type": "grammar-select",
	"question": { "en": "Which one means \"water\"?" },
	"prompt": { "bn": "___" },
	"options": [ { "bn": "জল" }, { "bn": "আম" }, { "bn": "কলম" } ],
	"correctIndex": 0
}
```
