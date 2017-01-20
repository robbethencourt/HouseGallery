module AddArtwork exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)


-- model


type alias Model =
    { error : Maybe String
    , artist : String
    , artistError : Maybe String
    , title : String
    , titleError : Maybe String
    , medium : String
    , mediumError : Maybe String
    , year : String
    , yearError : Maybe String
    , price : String
    , priceError : Maybe String
    , artworkImage : String
    , artworkImageError : Maybe String
    }


initModel : Model
initModel =
    { error = Nothing
    , artist = ""
    , artistError = Nothing
    , title = ""
    , titleError = Nothing
    , medium = ""
    , mediumError = Nothing
    , year = ""
    , yearError = Nothing
    , price = ""
    , priceError = Nothing
    , artworkImage = ""
    , artworkImageError = Nothing
    }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = ArtistInput String
    | TitleInput String
    | MediumInput String
    | YearInput String
    | PriceInput String
    | ArtworkImageInput String
    | Submit


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ArtistInput artist ->
            ( { model
                | artist = artist
                , artistError = Nothing
              }
            , Cmd.none
            )

        TitleInput title ->
            ( { model
                | title = title
                , titleError = Nothing
              }
            , Cmd.none
            )

        MediumInput medium ->
            ( { model
                | medium = medium
                , mediumError = Nothing
              }
            , Cmd.none
            )

        YearInput year ->
            ( { model
                | year = year
                , yearError = Nothing
              }
            , Cmd.none
            )

        PriceInput price ->
            ( { model
                | price = price
                , priceError = Nothing
              }
            , Cmd.none
            )

        ArtworkImageInput artworkImage ->
            ( { model
                | artworkImage = artworkImage
                , artworkImageError = Nothing
              }
            , Cmd.none
            )

        Submit ->
            ( model, Cmd.none )



-- view


view : Model -> Html Msg
view model =
    div [ class "main" ]
        [ errorPanel model.error
        , addArtwork model
        ]


addArtwork : Model -> Html Msg
addArtwork model =
    div []
        [ Html.form [ onSubmit Submit ]
            [ ul []
                [ li [] [ input [ type_ "text", value model.artist, onInput ArtistInput, placeholder "Artist" ] [] ]
                , li [] [ input [ type_ "text", value model.title, onInput TitleInput, placeholder "Title" ] [] ]
                , li [] [ input [ type_ "text", value model.medium, onInput MediumInput, placeholder "Medium" ] [] ]
                , li [] [ input [ type_ "text", value model.year, onInput YearInput, placeholder "Year" ] [] ]
                , li [] [ input [ type_ "text", value model.price, onInput PriceInput, placeholder "Price" ] [] ]
                , li [] [ input [ type_ "text", value model.artworkImage, onInput ArtworkImageInput, placeholder "Artwork Image File" ] [] ]
                ]
            , div [] [ button [ type_ "submit" ] [ text "Save Artwork" ] ]
            ]
        ]


errorPanel : Maybe String -> Html a
errorPanel error =
    case error of
        Nothing ->
            text ""

        Just msg ->
            div [ class "error" ]
                [ text msg ]



-- subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none
