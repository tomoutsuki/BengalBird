# figure_choice
Image (figure) choice exercises: match a Bengali word to the correct illustration.

Schema

- `id` (string)
- `type`: "figure_choice"
- `question` (object): localized prompt
- `bengali` (string): target Bengali word (optional)
- `romanized` (string): romanization (optional)
- `options` (array): each option contains:
	- `image` (string): path to image
	- `label` (object): localized label (`en`, `ja`, ...)
- `correctIndex` (number): zero-based index of correct option

Example

```json
{
	"id": "l1_ex3",
	"type": "figure_choice",
	"question": { "en": "Select the word for mango" },
	"bengali": "আম",
	"romanized": "am",
	"options": [
		{ "image": "assets/illustrations/mango.png", "label": { "en": "Mango" } },
		{ "image": "assets/illustrations/pen.png", "label": { "en": "Pen" } }
	],
	"correctIndex": 0
}
```
