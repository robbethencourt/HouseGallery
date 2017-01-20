module Artwork exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)


-- model


type alias Model =
    { error : Maybe String
    , active : Bool
    , artworkId : String
    , artist : String
    , title : String
    , medium : String
    , year : String
    , price : String
    , artworkImage : String
    }


initModel : Model
initModel =
    { error = Nothing
    , active = False
    , artworkId = ""
    , artist = ""
    , title = ""
    , medium = ""
    , year = ""
    , price = ""
    , artworkImage = ""
    }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = Error String


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Error error ->
            ( { model | error = Just error }, Cmd.none )



-- view


view : Model -> Html Msg
view model =
    div [ class "main" ]
        [ errorPanel model.error
        , artwork model
        ]


artwork : Model -> Html Msg
artwork model =
    div []
        [ ul []
            [ li [] [ text model.artist ]
            , li [] [ text model.title ]
            , li [] [ text model.medium ]
            , li [] [ text model.year ]
            , li [] [ text model.price ]
            , li [] [ text model.artworkImage ]
            ]
        , div [] [ button [] [ text "Save Artwork" ] ]
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
