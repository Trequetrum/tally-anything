import * as React from "react";

import { TextField } from "@mui/material";

function isNumeric(str: string): boolean {
  if (typeof str !== "string") return false;
  return !isNaN(str as any) && !isNaN(parseFloat(str));
}

export type NumericFieldOutput = "Empty" | "NaN" | number;

/********************************************************************
 * NumericTextField:
 * A string TextField that shows red error message for any input that
 * isn't a number. Only emits changes when NumericFieldOutput would
 * change. For example, a user typing a string causes this componant
 * to emit "NaN" only once.
 *******************************************************************/
export function NumericTextField({
  id,
  label,
  onChange,
  sx,
}: {
  id: string;
  label: string;
  onChange: (v: NumericFieldOutput) => void;
  sx?: any;
}) {
  const [value, setValue] = React.useState<NumericFieldOutput>("Empty");

  const error = value === "NaN";

  const setter = (v: NumericFieldOutput) => {
    setValue(v);
    onChange(v);
  };

  const handleChange = ({ target }: any) => {
    const text = target.value;
    if (isNumeric(text)) {
      const v = parseFloat(text);
      if (v !== value) setter(v);
    } else if (text.length < 1 && value !== "Empty") {
      setter("Empty");
    } else if (value !== "NaN") {
      setter("NaN");
    }
  };

  return (
    <TextField
      id={id}
      label={label}
      variant="outlined"
      sx={sx}
      onChange={handleChange}
      error={error}
      helperText={error ? "Must be a number" : "Ex: 22.5"}
    />
  );
}
