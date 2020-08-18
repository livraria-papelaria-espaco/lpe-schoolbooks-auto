import { Button, Link, Snackbar, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import axios from "axios";
import React, { useState } from "react";

const WOOK_REGEX = /<script type="application\/ld\+json">[^]*?({[^]+})[^]*?<\/script>[^]*?<!-- Fim Google/;

const getPublisherData = (publisher) => {
  switch (publisher) {
    case "Porto Editora":
      return { publisher: "", group: "pe" };
    case "Areal Editores":
      return { publisher: "areal", group: "pe" };
    case "Raiz Editora / Lisboa Editora":
      return { publisher: "raiz", group: "pe" };
    case "Texto Editores":
      return { publisher: "texto", group: "Leya" };
    case "Edições Asa":
      return { publisher: "asa", group: "Leya" };
    case "Santillana":
      return { publisher: "", group: "santillana" };
    default:
      return { publisher: "", group: publisher?.toLowerCase() || "" };
  }
};

const getFormattedIsbn = (isbn, { publisher, group }) => {
  if (group === "pe") {
    if (publisher !== "") return "";
    return isbn.split("-")[3] || "";
  }
  return isbn.replace(/-/g, "");
};

const parseBookData = ({ name, publisher, isbn }) => {
  const nameSplit = name.split(" - ");

  const typeIndex = nameSplit.findIndex((text) =>
    [
      "caderno de atividades",
      "workbook",
      "student's file",
      "cahier d'exercices",
      "cuaderno de ejercicios",
    ].some((v) => text.toLowerCase().trim().includes(v))
  );
  const type = typeIndex === -1 ? "m" : "ca";
  if (typeIndex !== -1) nameSplit.splice(typeIndex, 1);

  const schoolYearIndex = nameSplit.findIndex((text) =>
    text.toLowerCase().trim().includes("º ano")
  );
  const schoolYear =
    schoolYearIndex === -1
      ? 0
      : nameSplit[schoolYearIndex].trim().replace(/\.?º ano/i, "");
  if (schoolYearIndex !== -1) nameSplit.splice(schoolYearIndex, 1);

  const publisherData = getPublisherData(publisher);

  return {
    name: nameSplit[0] || "",
    type,
    schoolYear,
    isbn,
    ...publisherData,
    formattedIsbn: getFormattedIsbn(isbn, publisherData),
  };
};

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    marginTop: theme.spacing(4),
  },
  img: {
    height: 200,
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
        console.log(bookMetadata);
        stateData = parseBookData({
          name: bookMetadata.name,
          publisher: bookMetadata.publisher?.name,
          isbn: bookMetadata.isbn,
        });
        setData(stateData);
      }
      console.log(stateData);
      await navigator.clipboard.writeText(
        [
          "",
          stateData.name,
          stateData.schoolYear,
          stateData.formattedIsbn,
          stateData.type,
          stateData.publisher,
          stateData.group,
        ].join("\t")
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
        <Typography variant="body1">
          {data &&
            [
              data.name,
              data.schoolYear,
              data.formattedIsbn,
              data.type,
              data.publisher,
              data.group,
            ].join("  |  ")}
        </Typography>
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
