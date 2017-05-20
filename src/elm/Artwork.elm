port module Artwork exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Navigation
import Json.Encode as JE
import Json.Decode as JD
import Json.Decode.Pipeline as JDP
import Loading


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
    , dimensions : String
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
    , dimensions = ""
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
    | DimensionsEditInput String
    | PriceEditInput String
    | ArtworkImageFileEditInput String
    | FetchImageFileEdit String
    | SubmitEditedArtwork
    | DeleteArtwork
    | ArtworkDeleted String
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

            DimensionsEditInput dimensions ->
                ( { model | artwork = { artwork | dimensions = dimensions } }, Cmd.none )

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
                            , ( "dimensions", JE.string model.artwork.dimensions )
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

            DeleteArtwork ->
                ( model, deleteArtwork model.artwork.artworkId )

            ArtworkDeleted deletedMsg ->
                ( initModel, Navigation.newUrl "#/gallery" )

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
                , artwork = { artwork | dimensions = artwork.dimensions }
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
        |> JDP.required "dimensions" JD.string
        |> JDP.required "price" JD.string
        |> JDP.required "artworkImageFile" JD.string
        |> JDP.required "oldArtworkImageFile" JD.string



-- view


view : Model -> Html Msg
view model =
    if model.isFetching then
        div [ class "main" ]
            [ Loading.loadingSvg ]
    else if model.isEditing then
        div [ class "main main--gallery" ]
            [ div [ class "container" ]
                [ errorPanel model.error
                , editArtwork model
                ]
            ]
    else
        div [ class "main main--gallery" ]
            [ div [ class "container" ]
                [ errorPanel model.error
                , artwork model
                ]
            ]


artwork : Model -> Html Msg
artwork model =
    div [ class "row" ]
        [ div [ class "artwork-container vertical-align" ]
            [ div [ class "col-sm-6 artwork-container__col-sm-6" ]
                [ img [ src model.artwork.artworkImageFile ] []
                ]
            , div [ class "col-sm-6 artwork-container__col-sm-6" ]
                [ div [ class "text-center artwork-container__artwork-details" ]
                    [ h2 [ class "artwork-container__artwork-details__artist" ] [ text model.artwork.artist ]
                    , p [ class "artwork-container__artwork-details__title" ] [ text (model.artwork.title ++ ", " ++ model.artwork.year) ]
                    , p [ class "artwork-container__artwork-details__medium" ] [ text model.artwork.medium ]
                    , p [ class "artwork-container__artwork-details__dimensions" ] [ text model.artwork.dimensions ]
                    , p [ class "align-middle artwork-container__artwork-details__price" ] [ text ("$" ++ model.artwork.price) ]
                    , button [ class "btn btn--green", onClick EditArtwork ] [ text "edit artwork" ]
                    ]
                ]
            ]
        , div [ class "text-center" ]
            [ button [ class "btn btn-danger", onClick DeleteArtwork ] [ text "delete artwork" ] ]
        ]


editArtwork : Model -> Html Msg
editArtwork model =
    div [ class "row" ]
        [ div [ class "artwork-container vertical-align" ]
            [ div [ class "col-sm-6 artwork-container__col-sm-6" ]
                [ img [ src model.artwork.artworkImageFile ] []
                ]
            , div [ class "col-sm-6 artwork-container__col-sm-6" ]
                [ div [ class "text-center artwork-container__artwork-details" ]
                    [ Html.form [ class "formRow__form formRow__form--artwork-edit" ]
                        [ input
                            [ type_ "text"
                            , class "formRow__input artwork-container__input--artist"
                            , placeholder "artist"
                            , value model.artwork.artist
                            , onInput ArtistEditInput
                            ]
                            []
                        , input
                            [ type_ "text"
                            , class "formRow__input artwork-container__input--title"
                            , placeholder "title"
                            , value model.artwork.title
                            , onInput TitleEditInput
                            ]
                            []
                        , input
                            [ type_ "text"
                            , class "formRow__input artwork-container__input--medium"
                            , placeholder "medium"
                            , value model.artwork.medium
                            , onInput MediumEditInput
                            ]
                            []
                        , input
                            [ type_ "text"
                            , class "formRow__input artwork-container__input--year"
                            , placeholder "year"
                            , value model.artwork.year
                            , onInput YearEditInput
                            ]
                            []
                        , input
                            [ type_ "text"
                            , class "formRow__input artwork-container__input--dimensions"
                            , placeholder "dimensions (eg 72 x 20)"
                            , value model.artwork.dimensions
                            , onInput DimensionsEditInput
                            ]
                            []
                        , input
                            [ type_ "text"
                            , class "formRow__input artwork-container__input--price"
                            , placeholder "price"
                            , value model.artwork.price
                            , onInput PriceEditInput
                            ]
                            []
                        , input
                            [ type_ "file"
                            , class "formRow__input artwork-container__input--artworkImageFile"
                            , placeholder "artwork image file"
                            , id "cloudinary-input"
                            , onChange FetchImageFileEdit
                            ]
                            []
                        , button
                            [ class "btn btn--white formRow--btn"
                            , onClick SubmitEditedArtwork
                            ]
                            [ text "submit edited artwork" ]
                        ]
                    ]
                ]
            ]
        , div [ class "text-center div__btn--center" ]
            [ button [ class "btn btn--white btn--center", onClick ViewArtwork ] [ text "return to artwork view" ] ]
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
        , artworkDeleted ArtworkDeleted
        ]


port fetchingArtwork : (String -> msg) -> Sub msg


port artworkReceived : (String -> msg) -> Sub msg


port fetchImageFileEdit : String -> Cmd msg


port imageFileReadEdit : (String -> msg) -> Sub msg


port submitEditedArtwork : String -> Cmd msg


port deleteArtwork : String -> Cmd msg


port artworkDeleted : (String -> msg) -> Sub msg
