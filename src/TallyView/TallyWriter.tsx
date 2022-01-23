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

  const alertDialogOpener = React.useRef((title: string, message: string) => {})
  const [num, setNum] = React.useState<NumericFieldOutput>("Empty")

  const tallyClick = (count: number) => () => {

    if (count == 0 && num === "Empty"){
      alertDialogOpener.current("Tally Not Recorded", "Custom field was left empty")
      return;
    }else if (count == 0 && num === "NaN"){
      alertDialogOpener.current("Tally Not Recorded", "Custom field does not contain a number")
      return;
    }else if (count == 0){
      count = num as number
    }
    
    storeDispatch({
      type: "StoreWriteAction", 
      payload: { tag, date: Date.now(), count }
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
      <MsgAlert opener={alertDialogOpener}/>
    </Box>
  )
}