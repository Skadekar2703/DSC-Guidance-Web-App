import React from "react";
import { getSubjectIcon } from "../../config/subjectIconRegistry";

export const SubjectIcon = ({
  iconName,
  iconKey,
  subjectName = "",
  color,
  className = "h-6 w-6",
  style = {}
}) => {
  const targetKey = iconName || iconKey;
  const IconComponent = getSubjectIcon(targetKey, subjectName);

  const mergedStyle = color ? { color, ...style } : style;

  return <IconComponent className={className} style={mergedStyle} />;
};

export default SubjectIcon;
