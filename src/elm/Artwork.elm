port module Artwork exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Json.Encode as JE
import Json.Decode as JD
import Json.Decode.Pipeline as JDP


-- model


type alias Model =
    { error : Maybe String
    , active : Bool
    , artwork : Artwork
    , isEditing : Bool
    , isFetching : Bool
    }


type alias Artwork =
    { artworkId : String
    , artist : String
    , title : String
    , medium : String
    , year : String
    , price : String
    , artworkImageFile : String
    , oldArtworkImageFile : String
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
    , oldArtworkImageFile = ""
    }


initModel : Model
initModel =
    { error = Nothing
    , active = False
    , artwork = initArtwork
    , isEditing = False
    , isFetching = True
    }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = FetchingArtwork String
    | ArtworkReceived String
    | EditArtwork
    | ViewArtwork
    | ArtistEditInput String
    | TitleEditInput String
    | MediumEditInput String
    | YearEditInput String
    | PriceEditInput String
    | ArtworkImageFileEditInput String
    | FetchImageFileEdit String
    | SubmitEditedArtwork
    | Error String


update : String -> Msg -> Model -> ( Model, Cmd Msg )
update uid msg model =
    let
        artwork =
            model.artwork
    in
        case msg of
            FetchingArtwork fetching ->
                ( { model | isFetching = True }, Cmd.none )

            ArtworkReceived jsonArtwork ->
                decodeJson jsonArtwork model

            EditArtwork ->
                ( { model | isEditing = True }, Cmd.none )

            ViewArtwork ->
                ( { model | isEditing = False }, Cmd.none )

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

            FetchImageFileEdit filename ->
                ( { model | artwork = { artwork | oldArtworkImageFile = artwork.artworkImageFile } }, fetchImageFileEdit "cloudinary-input" )

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
                            , ( "oldArtworkImageFile", JE.string model.artwork.oldArtworkImageFile )
                            , ( "uid", JE.string uid )
                            ]
                            |> JE.encode 4

                    cmd =
                        submitEditedArtwork body
                in
                    ( { model
                        | artwork = { artwork | oldArtworkImageFile = "" }
                        , isEditing = False
                      }
                    , cmd
                    )

            Error error ->
                ( { model | error = Just error }, Cmd.none )


onChange : (String -> msg) -> Html.Attribute msg
onChange tagger =
    on "change" (JD.map tagger Html.Events.targetValue)


decodeJson : String -> Model -> ( Model, Cmd Msg )
decodeJson jsonArtwork model =
    case JD.decodeString decodeArtworkItem jsonArtwork of
        Ok artwork ->
            ( { model
                | isEditing = False
                , artwork = { artwork | artworkId = artwork.artworkId }
                , artwork = { artwork | artist = artwork.artist }
                , artwork = { artwork | title = artwork.title }
                , artwork = { artwork | medium = artwork.medium }
                , artwork = { artwork | year = artwork.year }
                , artwork = { artwork | price = artwork.price }
                , artwork = { artwork | artworkImageFile = artwork.artworkImageFile }
                , artwork = { artwork | oldArtworkImageFile = "" }
                , isFetching = False
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
        |> JDP.required "oldArtworkImageFile" JD.string



-- view


view : Model -> Html Msg
view model =
    if model.isFetching then
        div [ class "main" ]
            -- [ h1 [] [ text "Loading..." ] ]
            [ img [ src "dist/img/houseable-loading.svg" ] [] ]
    else if model.isEditing then
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
        [ p [] [ button [ onClick EditArtwork ] [ text "Edit Artwork" ] ]
        , ul []
            [ li [] [ text model.artwork.artist ]
            , li [] [ text model.artwork.title ]
            , li [] [ text model.artwork.medium ]
            , li [] [ text model.artwork.year ]
            , li [] [ text model.artwork.price ]
            , li [] [ img [ src model.artwork.artworkImageFile ] [] ]
            ]
        ]


editArtwork : Model -> Html Msg
editArtwork model =
    div []
        [ p [] [ button [ onClick ViewArtwork ] [ text "View Artwork" ] ]
        , ul []
            [ li [] [ input [ type_ "text", value model.artwork.artist, onInput ArtistEditInput ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.title, onInput TitleEditInput ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.medium, onInput MediumEditInput ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.year, onInput YearEditInput ] [] ]
            , li [] [ input [ type_ "text", value model.artwork.price, onInput PriceEditInput ] [] ]
              -- , li [] [ input [ type_ "text", value model.artwork.artworkImageFile, onInput ArtworkImageFileEditInput ] [] ]
            , li []
                [ input
                    [ type_ "file"
                    , class "form-control"
                    , id "cloudinary-input"
                    , onChange FetchImageFileEdit
                    ]
                    []
                ]
            ]
        , img [ src model.artwork.artworkImageFile, class "thumbnail" ] []
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
        [ fetchingArtwork FetchingArtwork
        , artworkReceived ArtworkReceived
        , imageFileReadEdit ArtworkImageFileEditInput
        ]


port fetchingArtwork : (String -> msg) -> Sub msg


port artworkReceived : (String -> msg) -> Sub msg


port fetchImageFileEdit : String -> Cmd msg


port imageFileReadEdit : (String -> msg) -> Sub msg


port submitEditedArtwork : String -> Cmd msg
