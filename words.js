// File: words.js
'use strict';

window.KF_STAGES = [
  {
    id: 'daily',
    title: 'Stage 1：身近なもの',
    desc: 'apple / book / water など基本の6語',
    artId: 32, // りんご
    words: [
      { id: 'apple', en: 'apple', ja: 'りんご' },
      { id: 'book', en: 'book', ja: '本' },
      { id: 'water', en: 'water', ja: '水' },
      { id: 'chair', en: 'chair', ja: 'いす' },
      { id: 'clock', en: 'clock', ja: '時計' },
      { id: 'bread', en: 'bread', ja: 'パン' }
    ]
  },
  {
    id: 'actions',
    title: 'Stage 2：まいにちの動詞',
    desc: 'walk / speak / think などよく使う6語',
    artId: 26, // ひよこ
    words: [
      { id: 'walk', en: 'walk', ja: '歩く' },
      { id: 'speak', en: 'speak', ja: '話す' },
      { id: 'write', en: 'write', ja: '書く' },
      { id: 'listen', en: 'listen', ja: '聞く' },
      { id: 'think', en: 'think', ja: '考える' },
      { id: 'smile', en: 'smile', ja: 'ほほえむ' }
    ]
  },
  {
    id: 'nature',
    title: 'Stage 3：自然・きせつ',
    desc: 'cloud / river / forest など自然の6語',
    artId: 25, // さくら
    words: [
      { id: 'cloud', en: 'cloud', ja: 'くも' },
      { id: 'river', en: 'river', ja: '川' },
      { id: 'forest', en: 'forest', ja: '森' },
      { id: 'morning', en: 'morning', ja: '朝' },
      { id: 'winter', en: 'winter', ja: '冬' },
      { id: 'flower', en: 'flower', ja: '花' }
    ]
  },
  {
    id: 'feeling',
    title: 'Stage 4：きもち・ようす',
    desc: 'happy / gentle / brave など形容詞の6語',
    artId: 24, // うさぎ
    words: [
      { id: 'happy', en: 'happy', ja: 'うれしい・幸せな' },
      { id: 'gentle', en: 'gentle', ja: 'やさしい' },
      { id: 'brave', en: 'brave', ja: 'ゆうかんな' },
      { id: 'quiet', en: 'quiet', ja: 'しずかな' },
      { id: 'honest', en: 'honest', ja: 'しょうじきな' },
      { id: 'bright', en: 'bright', ja: 'あかるい' }
    ]
  },
  {
    id: 'story',
    title: 'Stage 5：ストーリーの名詞',
    desc: 'journey / memory / promise など6語',
    artId: 10, // ロケット
    words: [
      { id: 'journey', en: 'journey', ja: '旅' },
      { id: 'memory', en: 'memory', ja: '思い出・記憶' },
      { id: 'promise', en: 'promise', ja: '約束' },
      { id: 'courage', en: 'courage', ja: 'ゆうき' },
      { id: 'future', en: 'future', ja: '未来' },
      { id: 'friend', en: 'friend', ja: '友だち' }
    ]
  }
];
