
// This file is now just a re-export file that brings together all the utilities from separate files

import {
  handleExerciseChange,
  handleQuestionChange,
  handleItemChange,
  handleSentenceChange,
  handleExpressionChange,
  handleTeacherTipChange,
  handleDialogueChange,
  handleStatementChange,
  handleWordBankChange
} from "../../utils/exerciseHandlers";

import {
  renderOtherExerciseTypes,
  renderTrueFalseExercise,
  getMatchedItems,
  shuffleArray
} from "../../utils/exerciseRenderers";

import {
  validateWorksheet,
  detectTemplateContent
} from "../../utils/worksheetUtils";

export {
  // Handlers
  handleExerciseChange,
  handleQuestionChange,
  handleItemChange,
  handleSentenceChange,
  handleExpressionChange,
  handleTeacherTipChange,
  handleDialogueChange,
  handleStatementChange,
  handleWordBankChange,
  
  // Renderers
  renderOtherExerciseTypes,
  renderTrueFalseExercise,
  getMatchedItems,
  shuffleArray,
  
  // Validators
  validateWorksheet,
  detectTemplateContent
};
