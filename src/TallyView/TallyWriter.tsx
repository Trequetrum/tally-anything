import * as React from "react";
import { Dispatch } from "react";

import {
  NumericTextField,
  NumericFieldOutput,
} from "../BasicComponents/NumericTextField";
import { Box, Button, Paper } from "@mui/material";
import { MsgAlert } from "../BasicComponents/MsgAlert";
import { sum } from "../util";
import { StoreAction } from "../StorageService/store-reducer";

export { TallyWriter };

function TallyWriter({
  tag,
  tallyButtons,
  storeDispatch,
}: {
  tag: string;
  tallyButtons: number[];
  storeDispatch: Dispatch<StoreAction>;
}) {
  const [alertDialogState, setAlertDialogState] = React.useState({
    open: false,
    title: "",
    message: "",
  });

  const [num, setNum] = React.useState<NumericFieldOutput>("Empty");
  const disableTallyButton = typeof num === "string";

  const tallyClick = (count: number) => () => {
    if (count === 0 && num === "Empty") {
      setAlertDialogState({
        open: true,
        title: "Tally Not Recorded",
        message: "Custom field was left empty",
      });
      return;
    } else if (count === 0 && num === "NaN") {
      setAlertDialogState({
        open: true,
        title: "Tally Not Recorded",
        message: "Custom field does not contain a number",
      });
      return;
    } else if (count === 0) {
      count = num as number;
    }

    storeDispatch({
      type: "Write",
      entry: { tag, date: new Date(), count },
    });
  };

  const prefabClicks = organiseTallyButtons(tallyButtons);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplate: "'txt txt txt tAny' 't0 t1 t2 t3' 't4 t5 t6 t7'",
        gridGap: 7,
      }}
    >
      {prefabClicks.map((n, i) => (
        <Button
          key={`Tally${n}`}
          sx={{ gridArea: `t${i}` }}
          variant="outlined"
          onClick={tallyClick(n)}
        >
          {n}
        </Button>
      ))}
      <NumericTextField
        id="count_by_numbers"
        label="Tally a custom amount"
        onChange={setNum}
        sx={{ gridArea: "txt" }}
      />
      <Button
        sx={{ gridArea: "tAny" }}
        variant="outlined"
        onClick={tallyClick(0)}
        disabled={disableTallyButton}
      >
        Tally
      </Button>
      <MsgAlert state={alertDialogState} setState={setAlertDialogState} />
    </Box>
  );
}

function organiseTallyButtons(tallyButtons: number[]): number[] {
  let buttons = Array.from(new Set(tallyButtons));

  if (buttons.length > 8) {
    buttons = buttons.slice(0, 8);
  } else {
    while (buttons.length < 8) {
      buttons.push(fitButton("higher", buttons));
      if (buttons.length < 8) {
        const include = fitButton("lower", buttons);
        if (include > 0) {
          buttons.push(include);
        }
      }
    }
  }

  return buttons.sort((a: number, b: number) => a - b);
}

function fitButton(type: "higher" | "lower", tallyButtons: number[]): number {
  const avg =
    tallyButtons.length > 0 ? sum(tallyButtons) / tallyButtons.length : 0;
  const trunc = Math.floor(avg / 5) * 5;

  let trying = trunc;
  let include: null | number = null;
  while (include == null) {
    if (tallyButtons.includes(trying === 0 ? 1 : trying)) {
      if (type === "higher") {
        trying += 5;
      } else {
        trying -= 5;
      }
    } else {
      include = trying === 0 ? 1 : trying;
    }
  }

  return include;
}
