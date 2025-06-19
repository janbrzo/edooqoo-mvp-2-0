
import { useState } from "react";
import { LessonTime, EnglishLevel, Tile } from './types';
import { GRAMMAR_FOCUS, WORKSHEET_SETS } from './constants';

// Funkcja do losowego wyboru zestawu 1-30
const getRandomSetIndex = (): number => {
  return Math.floor(Math.random() * WORKSHEET_SETS.length);
};

// Funkcja do losowego wyboru 2 kafelków Grammar Focus
const getRandomTiles = (tiles: Tile[], count = 2): Tile[] => {
  const shuffled = [...tiles].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const useWorksheetForm = () => {
  const [lessonTime, setLessonTime] = useState<LessonTime>("60 min");
  const [lessonTopic, setLessonTopic] = useState("");
  const [lessonGoal, setLessonGoal] = useState("");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [teachingPreferences, setTeachingPreferences] = useState("");
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel>("B1/B2");
  
  // Stany dla nowego systemu zestawów
  const [currentSetIndex, setCurrentSetIndex] = useState(() => getRandomSetIndex());
  const [randomGrammarFocus, setRandomGrammarFocus] = useState(getRandomTiles(GRAMMAR_FOCUS));

  const refreshTiles = () => {
    // Losuj nowy zestaw
    const newSetIndex = getRandomSetIndex();
    setCurrentSetIndex(newSetIndex);
    
    // Grammar Focus pozostaje jak było
    setRandomGrammarFocus(getRandomTiles(GRAMMAR_FOCUS));
  };

  return {
    lessonTime,
    setLessonTime,
    lessonTopic,
    setLessonTopic,
    lessonGoal,
    setLessonGoal,
    additionalInformation,
    setAdditionalInformation,
    teachingPreferences,
    setTeachingPreferences,
    englishLevel,
    setEnglishLevel,
    currentSetIndex,
    randomGrammarFocus,
    refreshTiles
  };
};
