port module Artwork exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Navigation
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
    | SubmitEditedArtwork
    | Error String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ArtworkReceived jsonArtwork ->
            decodeJson jsonArtwork model

        EditArtworkPage ->
            ( { model | isEditing = True }, Cmd.none )

        SubmitEditedArtwork ->
            ( { model | isEditing = False }, Cmd.none )

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
            [ li [] [ input [ type_ "text", value model.artwork.artist ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.title ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.medium ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.year ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.price ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.artworkImageFile ] [] ]
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
