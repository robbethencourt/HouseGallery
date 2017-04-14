port module AddArtwork exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Json.Decode as JD
import Json.Encode as JE


-- import Json.Decode as JD exposing (field)

import Navigation


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
    , artworkImageFile : String
    , artworkImageFileError : Maybe String
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
    , artworkImageFile = ""
    , artworkImageFileError = Nothing
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
    | FetchImageFile String
    | ArtworkImageInput String
    | Submit
    | ArtworkAdded String


update : String -> Msg -> Model -> ( Model, Cmd Msg )
update uid msg model =
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
            yearInputCheck model year

        PriceInput price ->
            priceInputCheck model price

        FetchImageFile filename ->
            ( model, fetchImageFile "cloudinary-input" )

        ArtworkImageInput artworkImageFile ->
            ( { model
                | artworkImageFile = artworkImageFile
                , artworkImageFileError = Nothing
              }
            , Cmd.none
            )

        Submit ->
            let
                updatedModel =
                    validate model

                body =
                    JE.object
                        [ ( "artist", JE.string model.artist )
                        , ( "title", JE.string model.title )
                        , ( "medium", JE.string model.medium )
                        , ( "year", JE.string model.year )
                        , ( "price", JE.string model.price )
                        , ( "artworkImage", JE.string model.artworkImageFile )
                        , ( "uid", JE.string uid )
                        ]
                        |> JE.encode 4

                cmd =
                    addArtworkToFb body
            in
                if isValid updatedModel then
                    ( initModel, cmd )
                else
                    ( updatedModel, Cmd.none )

        ArtworkAdded fbData ->
            if fbData == "Error" then
                ( { model | error = Just fbData }, Cmd.none )
            else
                ( initModel, Navigation.newUrl "#/gallery" )


onChange : (String -> msg) -> Html.Attribute msg
onChange tagger =
    on "change" (JD.map tagger Html.Events.targetValue)


yearInputCheck : Model -> String -> ( Model, Cmd Msg )
yearInputCheck model year =
    let
        yearInt =
            year
                |> String.toInt
                |> Result.withDefault 0

        yearError =
            if yearInt <= 0 then
                Just "Enter a positive number"
            else
                Nothing
    in
        ( { model
            | year = year
            , yearError = yearError
          }
        , Cmd.none
        )


priceInputCheck : Model -> String -> ( Model, Cmd Msg )
priceInputCheck model price =
    let
        priceInt =
            price
                |> String.toFloat
                |> Result.withDefault 0

        priceError =
            if priceInt <= 0 then
                Just "Enter a positive number"
            else
                Nothing
    in
        ( { model
            | price = price
            , priceError = priceError
          }
        , Cmd.none
        )


isValid : Model -> Bool
isValid model =
    model.artistError
        == Nothing
        && model.titleError
        == Nothing
        && model.mediumError
        == Nothing
        && model.yearError
        == Nothing
        && model.priceError
        == Nothing
        && model.artworkImageFileError
        == Nothing


validate : Model -> Model
validate model =
    model
        |> validateArtist
        |> validateTitle
        |> validateMedium
        |> validateYear
        |> validatePrice
        |> validateArtworkImage


validateArtist : Model -> Model
validateArtist model =
    if String.isEmpty model.artist then
        { model | artistError = Just "An Artist is Required" }
    else
        { model | artistError = Nothing }


validateTitle : Model -> Model
validateTitle model =
    if String.isEmpty model.title then
        { model | titleError = Just "A Title is Required" }
    else
        { model | titleError = Nothing }


validateMedium : Model -> Model
validateMedium model =
    if String.isEmpty model.medium then
        { model | mediumError = Just "A Medium is Required" }
    else
        { model | mediumError = Nothing }


validateYear : Model -> Model
validateYear model =
    let
        yearInt =
            model.year
                |> String.toInt
                |> Result.withDefault 0
    in
        if yearInt <= 0 then
            { model | yearError = Just "A Year is Required" }
        else
            { model | yearError = Nothing }


validatePrice : Model -> Model
validatePrice model =
    let
        priceFloat =
            model.year
                |> String.toFloat
                |> Result.withDefault 0
    in
        if priceFloat <= 0 then
            { model | priceError = Just "A Price is Required" }
        else
            { model | priceError = Nothing }


validateArtworkImage : Model -> Model
validateArtworkImage model =
    if String.isEmpty model.artworkImageFile then
        { model | artworkImageFileError = Just "An Image is Required" }
    else
        { model | artworkImageFileError = Nothing }



-- view


view : Model -> Html Msg
view model =
    div [ class "main" ]
        [ errorPanel model.error
        , addArtwork model
        ]


addArtwork : Model -> Html Msg
addArtwork model =
    div [ class "row formRow" ]
        [ div [ class "col-md-6 col-md-offset-3" ]
            [ Html.form [ class "formRow__form", onSubmit Submit ]
                [ input
                    [ type_ "text"
                    , class "formRow__input artwork-container__input--artist"
                    , placeholder "artist"
                    , value model.artist
                    , onInput ArtistInput
                    ]
                    []
                , p [ class "formRow__p--error" ] [ text <| Maybe.withDefault "" model.artistError ]
                , input
                    [ type_ "text"
                    , class "formRow__input artwork-container__input--title"
                    , placeholder "title"
                    , value model.title
                    , onInput TitleInput
                    ]
                    []
                , p [ class "formRow__p--error" ] [ text <| Maybe.withDefault "" model.titleError ]
                , input
                    [ type_ "text"
                    , class "formRow__input artwork-container__input--medium"
                    , placeholder "medium"
                    , value model.medium
                    , onInput MediumInput
                    ]
                    []
                , p [ class "formRow__p--error" ] [ text <| Maybe.withDefault "" model.mediumError ]
                , input
                    [ type_ "text"
                    , class "formRow__input artwork-container__input--year"
                    , placeholder "year"
                    , value model.year
                    , onInput YearInput
                    ]
                    []
                , p [ class "formRow__p--error" ] [ text <| Maybe.withDefault "" model.yearError ]
                , input
                    [ type_ "text"
                    , class "formRow__input artwork-container__input--price"
                    , placeholder "price"
                    , value model.price
                    , onInput PriceInput
                    ]
                    []
                , p [ class "formRow__p--error" ] [ text <| Maybe.withDefault "" model.priceError ]
                , input
                    [ type_ "file"
                    , class "formRow__input artwork-container__input--artworkImageFile"
                    , placeholder "artwork image file"
                    , id "cloudinary-input"
                    , onChange FetchImageFile
                    ]
                    []
                , p [ class "formRow__p--error" ] [ text <| Maybe.withDefault "" model.artworkImageFileError ]
                , img [ src model.artworkImageFile, class "thumbnail" ] []
                , button
                    [ type_ "submit"
                    , class "btn btn--white formRow--btn"
                    ]
                    [ text "add artwork" ]
                ]
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
    Sub.batch
        [ artworkAdded ArtworkAdded
        , imageFileRead ArtworkImageInput
        ]



-- ports


port addArtworkToFb : String -> Cmd msg


port artworkAdded : (String -> msg) -> Sub msg


port fetchImageFile : String -> Cmd msg


port imageFileRead : (String -> msg) -> Sub msg
