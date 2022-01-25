import * as React from 'react';

import { NumericTextField, NumericFieldOutput } from '../BasicComponents/NumericTextField'
import {
  Box,
  Button
} from '@mui/material';
import { MsgAlert } from '../BasicComponents/MsgAlert';
import { StoreWriter } from '../StorageService/store-reducer';

export { TallyWriter }

function TallyWriter(
  { tag, storeDispatch }:
    {
      tag: string,
      storeDispatch: StoreWriter
    }
) {

  const [alertDialogState, setAlertDialogState] = React.useState({ 
    open: false,
    title: "",
    message: ""
  });

  const [num, setNum] = React.useState<NumericFieldOutput>("Empty");

  const tallyClick = (count: number) => () => {

    if (count == 0 && num === "Empty"){
      setAlertDialogState({
        open: true,
        title: "Tally Not Recorded",
        message: "Custom field was left empty"
      });
      return;
    }else if (count == 0 && num === "NaN"){
      setAlertDialogState({
        open: true,
        title: "Tally Not Recorded",
        message: "Custom field does not contain a number"
      });
      return;
    }else if (count == 0){
      count = num as number
    }
    
    storeDispatch({
      type: "Write", 
      payload: { tag, date: new Date(), count }
    });
   
  }

  const prefabClicks = [1, 5, 10, 15, 20, 25, 30, 50]

  return (
    <Box sx={{
      display: 'grid',
      gridTemplate: "'t1 t5 t10 t15' 't20 t25 t30 t50' 'txt txt txt tAny'",
      gridGap: 7,
      marginBottom: 2
    }}>
      {prefabClicks.map(n =>
        <Button
          key={`Tally${n}`}
          sx={{ gridArea: `t${n}` }}
          variant="outlined"
          onClick={tallyClick(n)}
        >
          {`Tally ${n}`}
        </Button>
      )}
      <NumericTextField
        id="count_by_numbers"
        label="Tally a custom amount"
        onChange={setNum}
        sx={{ gridArea: 'txt' }}
      />
      <Button
        sx={{ gridArea: 'tAny' }}
        variant="outlined"
        onClick={tallyClick(0)}
      >
        Tally
      </Button>
      <MsgAlert state={alertDialogState} setState={setAlertDialogState}/>
    </Box>
  )
}