import { Dispatch } from "react";
import { Box, Paper, Typography } from "@mui/material";

import { compareEntryTimeDesc, Entry } from "../StorageService/store";
import { EntriesTable } from "./EntriesTable";
import { SummaryTable } from "./SummaryTable";
import { TallyWriter } from "./TallyWriter";
import { TagStateEntries } from "../App";
import { StoreAction } from "../StorageService/store-reducer";

export { TallyView };

function TallyView({
  tag,
  entries,
  storeDispatch,
}: {
  tag: string;
  entries: TagStateEntries;
  storeDispatch: Dispatch<StoreAction>;
}) {
  const entriesLoading = entries === "Loading";

  const tallyButtons = entriesLoading ? [] : decideWritterButtons(entries);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        mb: 4,
      }}
    >
      <Typography variant="h3" sx={{ mt: 6, mb: 2 }}>
        <strong style={{ fontWeight: 550 }}>{tag}</strong>
      </Typography>
      {entriesLoading ? (
        <h4 style={entriesLoading ? {} : { display: "none" }}>
          Loading Entries
        </h4>
      ) : (
        <Paper elevation={0} sx={{ padding: 1, mx: 1 }}>
          <TallyWriter
            tag={tag}
            tallyButtons={tallyButtons}
            storeDispatch={storeDispatch}
          />
        </Paper>
      )}
      <Box
        sx={{
          display: !entriesLoading && entries.length > 0 ? "flex" : "none",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Paper elevation={0} sx={{ mx: 1 }}>
          <SummaryTable entries={entriesLoading ? [] : entries} />
        </Paper>
        <Paper elevation={0} sx={{ mx: 1 }}>
          <EntriesTable
            tag={tag}
            entries={entriesLoading ? [] : entries}
            storeDispatch={storeDispatch}
          />
        </Paper>
      </Box>
    </Box>
  );
}

function decideWritterButtons(entries: Entry[]): number[] {
  let includes = new Set<number>();
  entries.sort(compareEntryTimeDesc).forEach(({ count }) => {
    if (includes.size < 8) {
      includes.add(count);
    }
  });
  return Array.from(includes);
}
