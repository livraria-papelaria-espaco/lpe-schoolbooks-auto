import { Button, Link, Snackbar, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import axios from "axios";
import React, { useState } from "react";

const WOOK_REGEX = /<script type="application\/ld\+json">[^]*?({[^]+})[^]*?<\/script>[^]*?<!-- Fim Google/;

const useStyles = makeStyles((theme) => ({
  root: {
    height: 200,
    display: "flex",
    marginTop: theme.spacing(4),
  },
  img: {
    height: "100%",
    marginRight: theme.spacing(2),
  },
}));

const Book = ({ img, url, title, author }) => {
  const [data, setData] = useState(null);
  const [snackbarText, setSnackbarText] = useState("");
  const classes = useStyles();

  const handleSnackbarClose = () => setSnackbarText("");

  const onCopy = async () => {
    try {
      let stateData = data;
      if (!stateData) {
        const response = await axios.get(url);
        const dataString = WOOK_REGEX.exec(response.data)?.[1] || [];
        const bookMetadata = JSON.parse(dataString);
        stateData = {
          name: bookMetadata.name,
          author: bookMetadata.author?.name,
          publisher: bookMetadata.publisher?.name,
        };
        setData(stateData);
      }
      console.log(stateData);
      await navigator.clipboard.writeText(
        [stateData.name, stateData.author, stateData.publisher].join("\t")
      );
      setSnackbarText("Texto copiado");
    } catch (e) {
      console.error(e);
      setSnackbarText("Ocorreu um erro");
    }
  };

  return (
    <div className={classes.root}>
      <img src={img} alt={title} className={classes.img} />
      <div>
        <Link href={url} target="_blank" rel="noreferrer">
          <Typography variant="h5">{title}</Typography>
        </Link>
        <Typography variant="h6">{author}</Typography>
        <Button variant="contained" color="primary" onClick={onCopy}>
          Copiar Informação
        </Button>
        <Button
          component={Link}
          href={`https://www.portoeditora.pt/produtos/ficha/${url
            .split("/")
            .pop()}`}
          target="_blank"
          rel="noreferrer"
        >
          Site Porto Editora
        </Button>
      </div>
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        open={!!snackbarText}
        autoHideDuration={1000}
        onClose={handleSnackbarClose}
        message={snackbarText}
      />
    </div>
  );
};

export default Book;
