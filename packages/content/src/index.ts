export interface EmojiWordCard {
  id: string;
  kana: string;
  romaji: string;
  meaning: string;
  emoji: string;
  script: "hiragana" | "katakana";
}

const baseWords: Omit<EmojiWordCard, "id">[] = [
  { kana: "ねこ", romaji: "neko", meaning: "cat", emoji: "🐱", script: "hiragana" },
  { kana: "いぬ", romaji: "inu", meaning: "dog", emoji: "🐶", script: "hiragana" },
  { kana: "さかな", romaji: "sakana", meaning: "fish", emoji: "🐟", script: "hiragana" },
  { kana: "とり", romaji: "tori", meaning: "bird", emoji: "🐦", script: "hiragana" },
  { kana: "りんご", romaji: "ringo", meaning: "apple", emoji: "🍎", script: "hiragana" },
  { kana: "みかん", romaji: "mikan", meaning: "orange", emoji: "🍊", script: "hiragana" },
  { kana: "すし", romaji: "sushi", meaning: "sushi", emoji: "🍣", script: "hiragana" },
  { kana: "おちゃ", romaji: "ocha", meaning: "tea", emoji: "🍵", script: "hiragana" },
  { kana: "ごはん", romaji: "gohan", meaning: "rice meal", emoji: "🍚", script: "hiragana" },
  { kana: "くるま", romaji: "kuruma", meaning: "car", emoji: "🚗", script: "hiragana" },
  { kana: "でんしゃ", romaji: "densha", meaning: "train", emoji: "🚆", script: "hiragana" },
  { kana: "じてんしゃ", romaji: "jitensha", meaning: "bicycle", emoji: "🚲", script: "hiragana" },
  { kana: "やま", romaji: "yama", meaning: "mountain", emoji: "⛰️", script: "hiragana" },
  { kana: "かわ", romaji: "kawa", meaning: "river", emoji: "🏞️", script: "hiragana" },
  { kana: "うみ", romaji: "umi", meaning: "sea", emoji: "🌊", script: "hiragana" },
  { kana: "ゆき", romaji: "yuki", meaning: "snow", emoji: "❄️", script: "hiragana" },
  { kana: "かさ", romaji: "kasa", meaning: "umbrella", emoji: "☂️", script: "hiragana" },
  { kana: "ほん", romaji: "hon", meaning: "book", emoji: "📘", script: "hiragana" },
  { kana: "とけい", romaji: "tokei", meaning: "clock", emoji: "⏰", script: "hiragana" },
  { kana: "がっこう", romaji: "gakkou", meaning: "school", emoji: "🏫", script: "hiragana" },
  { kana: "びょういん", romaji: "byouin", meaning: "hospital", emoji: "🏥", script: "hiragana" },
  { kana: "ぎんこう", romaji: "ginkou", meaning: "bank", emoji: "🏦", script: "hiragana" },
  { kana: "ぱん", romaji: "pan", meaning: "bread", emoji: "🍞", script: "hiragana" },
  { kana: "ぴざ", romaji: "piza", meaning: "pizza", emoji: "🍕", script: "hiragana" },
  { kana: "ぶどう", romaji: "budou", meaning: "grape", emoji: "🍇", script: "hiragana" },
  { kana: "ばなな", romaji: "banana", meaning: "banana", emoji: "🍌", script: "hiragana" },
  { kana: "ぺん", romaji: "pen", meaning: "pen", emoji: "🖊️", script: "hiragana" },
  { kana: "ぽけっと", romaji: "poketto", meaning: "pocket", emoji: "🧥", script: "hiragana" },
  { kana: "ざっし", romaji: "zasshi", meaning: "magazine", emoji: "📰", script: "hiragana" },
  { kana: "じかん", romaji: "jikan", meaning: "time", emoji: "⌛", script: "hiragana" },
  { kana: "コーヒー", romaji: "koohii", meaning: "coffee", emoji: "☕", script: "katakana" },
  { kana: "ジュース", romaji: "juusu", meaning: "juice", emoji: "🧃", script: "katakana" },
  { kana: "テレビ", romaji: "terebi", meaning: "television", emoji: "📺", script: "katakana" },
  { kana: "ラジオ", romaji: "rajio", meaning: "radio", emoji: "📻", script: "katakana" },
  { kana: "ホテル", romaji: "hoteru", meaning: "hotel", emoji: "🏨", script: "katakana" },
  { kana: "タクシー", romaji: "takushii", meaning: "taxi", emoji: "🚕", script: "katakana" },
  { kana: "バス", romaji: "basu", meaning: "bus", emoji: "🚌", script: "katakana" },
  { kana: "エレベーター", romaji: "erebeetaa", meaning: "elevator", emoji: "🛗", script: "katakana" },
  { kana: "スーパー", romaji: "suupaa", meaning: "supermarket", emoji: "🛒", script: "katakana" },
  { kana: "コンビニ", romaji: "konbini", meaning: "convenience store", emoji: "🏪", script: "katakana" },
  { kana: "カメラ", romaji: "kamera", meaning: "camera", emoji: "📷", script: "katakana" },
  { kana: "スマホ", romaji: "sumaho", meaning: "smartphone", emoji: "📱", script: "katakana" },
  { kana: "パソコン", romaji: "pasokon", meaning: "computer", emoji: "💻", script: "katakana" },
  { kana: "ゲーム", romaji: "geemu", meaning: "game", emoji: "🎮", script: "katakana" },
  { kana: "テスト", romaji: "tesuto", meaning: "test", emoji: "📝", script: "katakana" },
  { kana: "ノート", romaji: "nooto", meaning: "notebook", emoji: "📓", script: "katakana" },
  { kana: "ペン", romaji: "pen-k", meaning: "pen", emoji: "🖋️", script: "katakana" },
  { kana: "ボール", romaji: "booru", meaning: "ball", emoji: "⚽", script: "katakana" },
  { kana: "ドア", romaji: "doa", meaning: "door", emoji: "🚪", script: "katakana" },
  { kana: "ベッド", romaji: "beddo", meaning: "bed", emoji: "🛏️", script: "katakana" },
  { kana: "ソファ", romaji: "sofa", meaning: "sofa", emoji: "🛋️", script: "katakana" },
  { kana: "ピアノ", romaji: "piano", meaning: "piano", emoji: "🎹", script: "katakana" },
  { kana: "ギター", romaji: "gitaa", meaning: "guitar", emoji: "🎸", script: "katakana" },
  { kana: "バイオリン", romaji: "baiorin", meaning: "violin", emoji: "🎻", script: "katakana" },
  { kana: "ダンス", romaji: "dansu", meaning: "dance", emoji: "💃", script: "katakana" },
  { kana: "パーティー", romaji: "paatii", meaning: "party", emoji: "🎉", script: "katakana" },
  { kana: "プレゼント", romaji: "purezento", meaning: "present", emoji: "🎁", script: "katakana" },
  { kana: "チーズ", romaji: "chiizu", meaning: "cheese", emoji: "🧀", script: "katakana" },
  { kana: "ケーキ", romaji: "keeki", meaning: "cake", emoji: "🍰", script: "katakana" },
  { kana: "チョコ", romaji: "choko", meaning: "chocolate", emoji: "🍫", script: "katakana" }
];

export const wordCards: EmojiWordCard[] = Array.from({ length: 120 }, (_, index) => {
  const base = baseWords[index % baseWords.length];
  const cycle = Math.floor(index / baseWords.length);

  return {
    ...base,
    id: `w-${String(index + 1).padStart(3, "0")}`,
    meaning: cycle === 0 ? base.meaning : `${base.meaning} ${cycle + 1}`
  };
});
