
# grammar-sort

Reorder Bengali words.

```json
{
  "type": "grammar-sort",
  "words": ["আছেন?", "কেমন", "নমস্কার,"],
  "correctOrder": ["নমস্কার,", "কেমন", "আছেন?"]
}
```

Schema

- `id` (string)
- `type`: "grammar-sort"
- `question` (object): localized prompt
- `words` (array): words to be shuffled (Bengali strings)
- `wordsRomanized` (array, optional): romanizations matching `words`
- `correctOrder` (array): expected correct Bengali order
- `hint` (object, optional)

Example

```json
{
  "id": "ex1_grammar_sort",
  "type": "grammar-sort",
  "question": { "en": "Arrange the words to form: \"Hello, how are you?\"" },
  "words": ["আপনি", "কেমন", "নমস্কার,", "আছেন?"],
  "wordsRomanized": ["Apni", "Kemon", "Nomoshkar,", "Achhen?"],
  "correctOrder": ["নমস্কার,", "আপনি", "কেমন", "আছেন?"]
}
```
