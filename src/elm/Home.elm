module Home exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Navigation


-- model


type alias Model =
    { error : Maybe String }


initModel : Model
initModel =
    { error = Nothing }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = SignupPage


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        SignupPage ->
            ( { model | error = Just "woops" }, Navigation.newUrl "#/signup" )



-- view


view : Model -> Html Msg
view model =
    div [ class "fluid-container" ]
        [ div [ class "jumbotron jumbo-bg" ]
            [ div [ class "container" ]
                [ h1 [] [ text "houseable" ]
                , p [] [ em [] [ text "save, share and sell your art collection online" ] ]
                , button [ class "jumbotron__btn btn btn--white", onClick SignupPage ] [ text "sign up" ]
                ]
            ]
        ]



-- subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none
