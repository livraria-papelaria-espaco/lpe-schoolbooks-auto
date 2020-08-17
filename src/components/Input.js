import { Button, TextField } from "@material-ui/core";
import React, { useState } from "react";

import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  input: {
    flexGrow: 1,
    marginRight: theme.spacing(2),
  },
}));

const Input = ({ onClick }) => {
  const [input, setInput] = useState("");
  const classes = useStyles();

  const onInputChange = (e) => setInput(e.target.value);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onClick(input);
        }}
        className={classes.root}
      >
        <TextField
          label="Nome ou ISBN"
          value={input}
          onChange={onInputChange}
          className={classes.input}
        />
        <Button variant="contained" color="primary" type="submit">
          Procurar
        </Button>
      </form>
    </div>
  );
};

export default Input;
