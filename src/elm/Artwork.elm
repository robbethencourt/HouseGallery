port module Artwork exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Navigation
import Json.Encode as JE
import Json.Decode as JD
import Json.Decode.Pipeline as JDP


-- model


type alias Model =
    { error : Maybe String
    , active : Bool
    , artwork : Artwork
    , isEditing : Bool
    }


type alias Artwork =
    { artworkId : String
    , artist : String
    , title : String
    , medium : String
    , year : String
    , price : String
    , artworkImageFile : String
    }


initArtwork : Artwork
initArtwork =
    { artworkId = ""
    , artist = ""
    , title = ""
    , medium = ""
    , year = ""
    , price = ""
    , artworkImageFile = ""
    }


initModel : Model
initModel =
    { error = Nothing
    , active = False
    , artwork = initArtwork
    , isEditing = False
    }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = ArtworkReceived String
    | EditArtworkPage
    | ArtistEditInput String
    | TitleEditInput String
    | MediumEditInput String
    | YearEditInput String
    | PriceEditInput String
    | ArtworkImageFileEditInput String
    | SubmitEditedArtwork
    | Error String


update : String -> Msg -> Model -> ( Model, Cmd Msg )
update uid msg model =
    let
        artwork =
            model.artwork
    in
        case msg of
            ArtworkReceived jsonArtwork ->
                decodeJson jsonArtwork model

            EditArtworkPage ->
                ( { model | isEditing = True }, Cmd.none )

            ArtistEditInput artist ->
                ( { model | artwork = { artwork | artist = artist } }, Cmd.none )

            TitleEditInput title ->
                ( { model | artwork = { artwork | title = title } }, Cmd.none )

            MediumEditInput medium ->
                ( { model | artwork = { artwork | medium = medium } }, Cmd.none )

            YearEditInput year ->
                ( { model | artwork = { artwork | year = year } }, Cmd.none )

            PriceEditInput price ->
                ( { model | artwork = { artwork | price = price } }, Cmd.none )

            ArtworkImageFileEditInput artworkImageFile ->
                ( { model | artwork = { artwork | artworkImageFile = artworkImageFile } }, Cmd.none )

            SubmitEditedArtwork ->
                let
                    body =
                        JE.object
                            [ ( "artworkId", JE.string model.artwork.artworkId )
                            , ( "artist", JE.string model.artwork.artist )
                            , ( "title", JE.string model.artwork.title )
                            , ( "medium", JE.string model.artwork.medium )
                            , ( "year", JE.string model.artwork.year )
                            , ( "price", JE.string model.artwork.price )
                            , ( "artworkImage", JE.string model.artwork.artworkImageFile )
                            , ( "uid", JE.string uid )
                            ]
                            |> JE.encode 4

                    cmd =
                        submitEditedArtwork body
                in
                    ( { model | isEditing = False }, cmd )

            Error error ->
                ( { model | error = Just error }, Cmd.none )


decodeJson : String -> Model -> ( Model, Cmd Msg )
decodeJson jsonArtwork model =
    case JD.decodeString decodeArtworkItem jsonArtwork of
        Ok artwork ->
            ( { model
                | artwork = { artwork | artworkId = artwork.artworkId }
                , artwork = { artwork | artist = artwork.artist }
                , artwork = { artwork | title = artwork.title }
                , artwork = { artwork | medium = artwork.medium }
                , artwork = { artwork | year = artwork.year }
                , artwork = { artwork | price = artwork.price }
                , artwork = { artwork | artworkImageFile = artwork.artworkImageFile }
              }
            , Cmd.none
            )

        Err err ->
            ( { model | error = Just err }, Cmd.none )


decodeArtworkItem : JD.Decoder Artwork
decodeArtworkItem =
    JDP.decode Artwork
        |> JDP.required "artworkId" JD.string
        |> JDP.required "artist" JD.string
        |> JDP.required "title" JD.string
        |> JDP.required "medium" JD.string
        |> JDP.required "year" JD.string
        |> JDP.required "price" JD.string
        |> JDP.required "artworkImageFile" JD.string



-- view


view : Model -> Html Msg
view model =
    if model.isEditing then
        div [ class "main" ]
            [ errorPanel model.error
            , editArtwork model
            ]
    else
        div [ class "main" ]
            [ errorPanel model.error
            , artwork model
            ]


artwork : Model -> Html Msg
artwork model =
    div []
        [ ul []
            [ li [] [ text model.artwork.artist ]
            , li [] [ text model.artwork.title ]
            , li [] [ text model.artwork.medium ]
            , li [] [ text model.artwork.year ]
            , li [] [ text model.artwork.price ]
            , li [] [ text model.artwork.artworkImageFile ]
            ]
        , div [] [ button [ onClick EditArtworkPage ] [ text "Edit Artwork" ] ]
        ]


editArtwork : Model -> Html Msg
editArtwork model =
    div []
        [ ul []
            [ li [] [ input [ type_ "text", value model.artwork.artist, onInput ArtistEditInput ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.title, onInput TitleEditInput ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.medium, onInput MediumEditInput ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.year, onInput YearEditInput ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.price, onInput PriceEditInput ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.artworkImageFile, onInput ArtworkImageFileEditInput ] [] ]
            ]
        , div [] [ button [ onClick SubmitEditedArtwork ] [ text "Edit Artwork" ] ]
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
    Sub.batch
        [ artworkReceived ArtworkReceived ]


port artworkReceived : (String -> msg) -> Sub msg


port submitEditedArtwork : String -> Cmd msg
