# writing_keyboard
On-screen keyboard typing exercises. Learners assemble a word using provided key tiles.

Schema

- `id` (string)
- `type`: "writing_keyboard"
- `question` (object): localized prompt
- `romanized` (string, optional)
- `correctAnswer` (string): expected Bengali string
- `acceptableAnswers` (array)
- `keys` (array): list of key objects `{ "letter": "আ" }` used to construct input
- `hint` (object, optional)

Example

```json
{
	"id": "l1_ex4",
	"type": "writing_keyboard",
	"question": { "en": "Type the word: আম" },
	"romanized": "am",
	"correctAnswer": "আম",
	"acceptableAnswers": ["আম"],
	"keys": [ { "letter": "আ" }, { "letter": "ম" } ]
}
```
Bengali keyboard typing exercise.
