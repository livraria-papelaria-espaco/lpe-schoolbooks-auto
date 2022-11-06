import {
  Box,
  CircularProgress,
  Container,
  Typography,
  Grid,
  Switch,
} from "@material-ui/core";
import axios from "axios";
import React, { useState } from "react";
import Book from "./components/Book";
import Input from "./components/Input";

const WOOK_REGEX = /<script type="application\/ld\+json">([^]+?)<\/script>/;

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [items, setItems] = useState([]);
  const [isSchoolbooks, setSchoolbooks] = useState(false);

  const handleSchoolbooks = (e) => setSchoolbooks(e.target.checked);

  const onClick = async (input) => {
    try {
      setError(false);
      setItems([]);
      setLoading(true);
      const response = await axios.get(
        `https://www.wook.pt/pesquisa/${encodeURIComponent(input).replace(
          " ",
          "+"
        )}`
      );
      const domParser = new DOMParser();
      const responseDocument = domParser.parseFromString(
        response.data,
        "text/html"
      );
      try {
        const data = Array.from(
          responseDocument
            .getElementsByClassName("search-products")[0]
            .getElementsByClassName("product")
        ).map((v) => ({
          img: v.getElementsByClassName("img-responsive")[0]?.dataset?.src,
          url: `https://www.wook.pt${v
            .getElementsByTagName("a")[0]
            ?.getAttribute("href")}`,
          title: v.getElementsByClassName("title-lnk")[0]?.innerText?.trim(),
          author: v.getElementsByClassName("autor")[0]?.innerText?.trim(),
        }));
        setItems(data);
        setLoading(false);
      } catch (e) {
        const dataString = WOOK_REGEX.exec(response.data)?.[1];
        if (!dataString) {
          console.error(e);
          setLoading(false);
          setError(true);
          return;
        }

        const bookMetadata = JSON.parse(dataString);
        console.log(bookMetadata);
        setItems([
          {
            title: bookMetadata.name,
            publisher: bookMetadata.publisher?.name,
            isbn: bookMetadata.isbn,
            url: response.request.responseURL || "",
            author: bookMetadata.author?.name,
            img: bookMetadata.image,
          },
        ]);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError(true);
    }
  };

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Info Livros LPE
        </Typography>
        <Grid component="label" container alignItems="center" spacing={1}>
          <Grid item style={{ fontWeight: isSchoolbooks ? "normal" : "bold" }}>
            Livros Não Escolares
          </Grid>
          <Grid item>
            <Switch
              color="primary"
              checked={isSchoolbooks}
              onChange={handleSchoolbooks}
            />
          </Grid>
          <Grid item style={{ fontWeight: isSchoolbooks ? "bold" : "normal" }}>
            Livros Escolares
          </Grid>
        </Grid>
        <Input onClick={onClick} />
        {items.map((book) => (
          <Book key={book.url} {...book} isSchoolbooks={isSchoolbooks} />
        ))}
        {error && (
          <Typography variant="h6" color="error">
            Ocorreu um erro
          </Typography>
        )}
        {loading && <CircularProgress />}
      </Box>
    </Container>
  );
}
