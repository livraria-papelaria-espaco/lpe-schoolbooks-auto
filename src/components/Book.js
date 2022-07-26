import { Button, Link, Snackbar, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import axios from "axios";
import React, { useState, useEffect } from "react";
import publisherMapping from "../data/publisherMapping.json";

const WOOK_REGEX =
  /<script type="application\/ld\+json">[^]*?({[^]+})[^]*?<\/script>[^]*?<!-- Fim Google/;

const getPublisherData = (publisher, wookId) => {
  switch (publisher) {
    case "Porto Editora":
      return {
        publisher: "",
        group: "pe",
        publisherUrl: `www.portoeditora.pt/produtos/ficha/${wookId}`,
      };
    case "Areal Editores":
      return {
        publisher: "areal",
        group: "pe",
        publisherUrl: `www.arealeditores.pt/produtos/ficha/${wookId}`,
      };
    case "Raiz Editora / Lisboa Editora":
      return {
        publisher: "raiz",
        group: "pe",
        publisherUrl: `www.raizeditora.pt/produtos/ficha/${wookId}`,
      };
    case "Texto Editores":
      return { publisher: "texto", group: "Leya" };
    case "Edições Asa":
      return { publisher: "asa", group: "Leya" };
    case "Santillana":
      return { publisher: "", group: "santillana" };
    default:
      const normalized =
        publisher
          ?.normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase()
          .trim() || "";

      const [group] =
        Object.entries(publisherMapping).find(
          ([_group, associatedPublishers]) =>
            associatedPublishers.includes(normalized)
        ) || [];

      if (group) {
        return { publisher: normalized, group };
      }

      return { publisher: publisher?.toLowerCase() || "", group: "" };
  }
};

const getFormattedIsbn = async (isbn, { publisher, group, publisherUrl }) => {
  if (group === "pe") {
    if (!publisherUrl) return "";
    return await getBookCodeFromPEGroup(publisherUrl);
  }
  return isbn.replace(/-/g, "");
};

const getBookCodeFromPEGroup = async (publisherUrl) => {
  try {
    const { data } = await axios.get(
      `https://labs.diogotc.com/portoeditora-schoolbook-code/${publisherUrl}`
    );
    return data.code || "";
  } catch (e) {
    return "";
  }
};

const parseBookData = async ({ name, publisher, isbn, wookId }) => {
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

  const publisherData = getPublisherData(publisher, wookId);

  return {
    name: nameSplit[0] || "",
    type,
    schoolYear,
    isbn,
    ...publisherData,
    formattedIsbn: await getFormattedIsbn(isbn, publisherData),
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

const Book = ({ img, url, title, author, publisher, isbn, isSchoolbooks }) => {
  const [data, setData] = useState(null);
  const [snackbarText, setSnackbarText] = useState("");
  const classes = useStyles();

  const wookId = url.split("/").pop();

  useEffect(() => {
    if (publisher && isbn)
      parseBookData({
        name: title,
        publisher,
        isbn,
        wookId,
      }).then(setData);
  }, [title, wookId, publisher, isbn]);

  const handleSnackbarClose = () => setSnackbarText("");

  const onCopy = async () => {
    try {
      let stateData = data;
      if (!stateData) {
        const response = await axios.get(url);
        const dataString = WOOK_REGEX.exec(response.data)?.[1] || "{}";
        const bookMetadata = JSON.parse(dataString);
        console.log(bookMetadata);
        stateData = await parseBookData({
          name: bookMetadata.name,
          publisher: bookMetadata.publisher?.name,
          isbn: bookMetadata.isbn,
          wookId,
        });
        setData(stateData);
      }
      console.log(stateData);
      if (isSchoolbooks) {
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
      } else {
        await navigator.clipboard.writeText(
          [
            "",
            stateData.name,
            stateData.formattedIsbn,
            stateData.publisher,
            stateData.group,
          ].join("\t")
        );
      }
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
        {data && data.publisherUrl && (
          <Button
            component={Link}
            href={`https://${data.publisherUrl}`}
            target="_blank"
            rel="noreferrer"
          >
            Site Editora
          </Button>
        )}
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
