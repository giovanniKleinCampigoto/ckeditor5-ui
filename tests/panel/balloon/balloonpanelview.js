/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global window, document, Event */

import global from '@ckeditor/ckeditor5-utils/src/dom/global';
import ViewCollection from '../../../src/viewcollection';
import BalloonPanelView from '../../../src/panel/balloon/balloonpanelview';
import ButtonView from '../../../src/button/buttonview';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';
import * as positionUtils from '@ckeditor/ckeditor5-utils/src/dom/position';

testUtils.createSinonSandbox();

describe( 'BalloonPanelView', () => {
	let view, windowStub;

	beforeEach( () => {
		view = new BalloonPanelView();

		view.set( 'maxWidth', 200 );

		return view.init();
	} );

	afterEach( () => {
		if ( view ) {
			return view.destroy();
		}
	} );

	describe( 'constructor()', () => {
		it( 'should create element from template', () => {
			expect( view.element.tagName ).to.equal( 'DIV' );
			expect( view.element.classList.contains( 'ck-balloon-panel' ) ).to.true;
			expect( view.element.getAttribute( 'tabindex' ) ).to.equal( '-1' );
		} );

		it( 'should set default values', () => {
			expect( view.top ).to.equal( 0 );
			expect( view.left ).to.equal( 0 );
			expect( view.position ).to.equal( 'arrow_se' );
			expect( view.isVisible ).to.equal( false );
			expect( view.withArrow ).to.equal( true );
		} );

		it( 'creates view#content collection', () => {
			expect( view.content ).to.be.instanceOf( ViewCollection );
		} );
	} );

	describe( 'DOM bindings', () => {
		describe( 'arrow', () => {
			it( 'should react on view#position', () => {
				expect( view.element.classList.contains( 'ck-balloon-panel_arrow_se' ) ).to.true;

				view.position = 'arrow_sw';

				expect( view.element.classList.contains( 'ck-balloon-panel_arrow_sw' ) ).to.true;
			} );

			it( 'should react on view#withArrow', () => {
				expect( view.element.classList.contains( 'ck-balloon-panel_with-arrow' ) ).to.be.true;

				view.withArrow = false;

				expect( view.element.classList.contains( 'ck-balloon-panel_with-arrow' ) ).to.be.false;
			} );
		} );

		describe( 'isVisible', () => {
			it( 'should react on view#isvisible', () => {
				expect( view.element.classList.contains( 'ck-balloon-panel_visible' ) ).to.false;

				view.isVisible = true;

				expect( view.element.classList.contains( 'ck-balloon-panel_visible' ) ).to.true;
			} );
		} );

		describe( 'styles', () => {
			it( 'should react on view#top', () => {
				expect( view.element.style.top ).to.equal( '0px' );

				view.top = 10;

				expect( view.element.style.top ).to.equal( '10px' );
			} );

			it( 'should react on view#left', () => {
				expect( view.element.style.left ).to.equal( '0px' );

				view.left = 10;

				expect( view.element.style.left ).to.equal( '10px' );
			} );

			it( 'should react on view#maxWidth', () => {
				expect( view.element.style.maxWidth ).to.equal( '200px' );

				view.maxWidth = 10;

				expect( view.element.style.maxWidth ).to.equal( '10px' );
			} );
		} );

		describe( 'children', () => {
			it( 'should react on view#content', () => {
				expect( view.element.childNodes.length ).to.equal( 0 );

				const button = new ButtonView( { t() {} } );

				return view.content.add( button ).then( () => {
					expect( view.element.childNodes.length ).to.equal( 1 );
				} );
			} );
		} );
	} );

	describe( 'isVisible', () => {
		it( 'should return view#isVisible value', () => {
			expect( view.isVisible ).to.false;

			view.isVisible = true;

			expect( view.isVisible ).to.true;
		} );
	} );

	describe( 'show()', () => {
		it( 'should set view#isVisible as true', () => {
			view.isVisible = false;

			view.show();

			expect( view.isVisible ).to.true;
		} );
	} );

	describe( 'hide()', () => {
		it( 'should set view#isVisible as false', () => {
			view.isVisible = true;

			view.hide();

			expect( view.isVisible ).to.false;
		} );
	} );

	describe( 'attachTo()', () => {
		let target, limiter;

		beforeEach( () => {
			limiter = document.createElement( 'div' );
			target = document.createElement( 'div' );

			// Mock balloon panel element dimensions.
			mockBoundingBox( view.element, {
				top: 0,
				left: 0,
				width: 100,
				height: 100
			} );

			// Mock window dimensions.
			windowStub = {
				innerWidth: 500,
				innerHeight: 500,
				scrollX: 0,
				scrollY: 0,
				getComputedStyle: ( el ) => {
					return window.getComputedStyle( el );
				}
			};

			testUtils.sinon.stub( global, 'window', windowStub );
		} );

		it( 'should use default options', () => {
			const spy = testUtils.sinon.spy( positionUtils, 'getOptimalPosition' );

			view.attachTo( { target } );

			sinon.assert.calledWithExactly( spy, sinon.match( {
				element: view.element,
				target: target,
				positions: [
					BalloonPanelView.defaultPositions.se,
					BalloonPanelView.defaultPositions.sw,
					BalloonPanelView.defaultPositions.ne,
					BalloonPanelView.defaultPositions.nw
				],
				limiter: document.body,
				fitInViewport: true
			} ) );
		} );

		describe( 'limited by limiter element', () => {
			beforeEach( () => {
				// Mock limiter element dimensions.
				mockBoundingBox( limiter, {
					left: 0,
					top: 0,
					width: 500,
					height: 500
				} );
			} );

			it( 'should put balloon on the `south east` side of the target element at default', () => {
				// Place target element at the center of the limiter.
				mockBoundingBox( target, {
					top: 225,
					left: 225,
					width: 50,
					height: 50
				} );

				view.attachTo( { target, limiter } );

				expect( view.position ).to.equal( 'arrow_se' );
			} );

			it( 'should put balloon on the `south east` side of the target element when target is on the top left side of the limiter', () => {
				mockBoundingBox( target, {
					top: 0,
					left: 0,
					width: 50,
					height: 50
				} );

				view.attachTo( { target, limiter } );

				expect( view.position ).to.equal( 'arrow_se' );
			} );

			it( 'should put balloon on the `south west` side of the target element when target is on the right side of the limiter', () => {
				mockBoundingBox( target, {
					top: 0,
					left: 450,
					width: 50,
					height: 50
				} );

				view.attachTo( { target, limiter } );

				expect( view.position ).to.equal( 'arrow_sw' );
			} );

			it( 'should put balloon on the `north east` side of the target element when target is on the bottom of the limiter ', () => {
				mockBoundingBox( target, {
					top: 450,
					left: 0,
					width: 50,
					height: 50
				} );

				view.attachTo( { target, limiter } );

				expect( view.position ).to.equal( 'arrow_ne' );
			} );

			it( 'should put balloon on the `north west` side of the target element when target is on the bottom right of the limiter', () => {
				mockBoundingBox( target, {
					top: 450,
					left: 450,
					width: 50,
					height: 50
				} );

				view.attachTo( { target, limiter } );

				expect( view.position ).to.equal( 'arrow_nw' );
			} );

			// https://github.com/ckeditor/ckeditor5-ui-default/issues/126
			it( 'works in a positioned ancestor (position: absolute)', () => {
				const positionedAncestor = document.createElement( 'div' );

				positionedAncestor.style.position = 'absolute';
				positionedAncestor.style.top = '100px';
				positionedAncestor.style.left = '100px';
				positionedAncestor.appendChild( view.element );

				document.body.appendChild( positionedAncestor );
				positionedAncestor.appendChild( view.element );

				mockBoundingBox( positionedAncestor, {
					top: 100,
					left: 100,
					width: 10,
					height: 10
				} );

				mockBoundingBox( target, {
					top: 0,
					left: 0,
					width: 100,
					height: 100
				} );

				view.attachTo( { target, limiter } );

				expect( view.top ).to.equal( 15 );
				expect( view.left ).to.equal( -80 );
			} );

			// https://github.com/ckeditor/ckeditor5-ui-default/issues/126
			it( 'works in a positioned ancestor (position: static)', () => {
				const positionedAncestor = document.createElement( 'div' );

				positionedAncestor.style.position = 'static';
				positionedAncestor.appendChild( view.element );

				document.body.appendChild( positionedAncestor );
				positionedAncestor.appendChild( view.element );

				mockBoundingBox( target, {
					top: 0,
					left: 0,
					width: 100,
					height: 100
				} );

				view.attachTo( { target, limiter } );

				expect( view.top ).to.equal( 115 );
				expect( view.left ).to.equal( 20 );
			} );
		} );

		describe( 'limited by viewport', () => {
			it( 'should put balloon on the `south west` position when `south east` is limited', () => {
				mockBoundingBox( limiter, {
					left: 0,
					top: 0,
					width: 500,
					height: 500
				} );

				mockBoundingBox( target, {
					top: 0,
					left: 225,
					width: 50,
					height: 50
				} );

				Object.assign( windowStub, {
					innerWidth: 275
				} );

				view.attachTo( { target, limiter } );

				expect( view.position ).to.equal( 'arrow_sw' );
			} );

			it( 'should put balloon on the `south east` position when `south west` is limited', () => {
				mockBoundingBox( limiter, {
					top: 0,
					left: -400,
					width: 500,
					height: 500
				} );

				mockBoundingBox( target, {
					top: 0,
					left: 0,
					width: 50,
					height: 50
				} );

				view.attachTo( { target, limiter } );

				expect( view.position ).to.equal( 'arrow_se' );
			} );

			it( 'should put balloon on the `north east` position when `south east` is limited', () => {
				mockBoundingBox( limiter, {
					left: 0,
					top: 0,
					width: 500,
					height: 500
				} );

				mockBoundingBox( target, {
					top: 225,
					left: 0,
					width: 50,
					height: 50
				} );

				Object.assign( windowStub, {
					innerHeight: 275
				} );

				view.attachTo( { target, limiter } );

				expect( view.position ).to.equal( 'arrow_ne' );
			} );

			it( 'should put balloon on the `south east` position when `north east` is limited', () => {
				mockBoundingBox( limiter, {
					left: 0,
					top: -400,
					width: 500,
					height: 500
				} );

				mockBoundingBox( target, {
					top: 0,
					left: 0,
					width: 50,
					height: 50
				} );

				view.attachTo( { target, limiter } );

				expect( view.position ).to.equal( 'arrow_se' );
			} );
		} );
	} );

	describe( 'pin() and unpin()', () => {
		let attachToSpy, target, targetParent, limiter, notRelatedElement;

		beforeEach( () => {
			attachToSpy = sinon.spy( view, 'attachTo' );
			limiter = document.createElement( 'div' );
			targetParent = document.createElement( 'div' );
			target = document.createElement( 'div' );
			notRelatedElement = document.createElement( 'div' );

			view.show();

			targetParent.appendChild( target );
			document.body.appendChild( targetParent );
			document.body.appendChild( limiter );
			document.body.appendChild( notRelatedElement );
		} );

		afterEach( () => {
			targetParent.remove();
			limiter.remove();
			notRelatedElement.remove();
		} );

		describe( 'pin()', () => {
			it( 'should not show the balloon', () => {
				const showSpy = sinon.spy( view, 'show' );

				view.hide();

				view.pin( { target, limiter } );
				sinon.assert.notCalled( showSpy );
			} );

			it( 'should start pinning when the balloon is visible', () => {
				view.hide();
				view.pin( { target, limiter } );

				targetParent.dispatchEvent( new Event( 'scroll' ) );

				view.show();

				targetParent.dispatchEvent( new Event( 'scroll' ) );

				sinon.assert.calledTwice( attachToSpy );
			} );

			it( 'should stop pinning when the balloon becomes invisible', () => {
				view.show();

				view.pin( { target, limiter } );
				sinon.assert.calledOnce( attachToSpy );

				view.hide();

				targetParent.dispatchEvent( new Event( 'scroll' ) );
				sinon.assert.calledOnce( attachToSpy );
			} );

			it( 'should unpin if already pinned', () => {
				const unpinSpy = testUtils.sinon.spy( view, 'unpin' );

				view.show();
				sinon.assert.notCalled( attachToSpy );

				view.pin( { target, limiter } );
				sinon.assert.calledOnce( attachToSpy );

				view.pin( { target, limiter } );
				sinon.assert.calledTwice( unpinSpy );

				targetParent.dispatchEvent( new Event( 'scroll' ) );
				sinon.assert.calledThrice( attachToSpy );
			} );

			it( 'should keep the balloon pinned to the target when any of the related elements is scrolled', () => {
				view.pin( { target, limiter } );

				sinon.assert.calledOnce( attachToSpy );
				sinon.assert.calledWith( attachToSpy.lastCall, { target, limiter } );

				targetParent.dispatchEvent( new Event( 'scroll' ) );

				sinon.assert.calledTwice( attachToSpy );
				sinon.assert.calledWith( attachToSpy.lastCall, { target, limiter } );

				limiter.dispatchEvent( new Event( 'scroll' ) );

				sinon.assert.calledThrice( attachToSpy );
				sinon.assert.calledWith( attachToSpy.lastCall, { target, limiter } );

				notRelatedElement.dispatchEvent( new Event( 'scroll' ) );

				// Nothing's changed.
				sinon.assert.calledThrice( attachToSpy );
				sinon.assert.calledWith( attachToSpy.lastCall, { target, limiter } );
			} );

			it( 'should keep the balloon pinned to the target when the browser window is being resized', () => {
				view.pin( { target, limiter } );

				sinon.assert.calledOnce( attachToSpy );
				sinon.assert.calledWith( attachToSpy.lastCall, { target, limiter } );

				window.dispatchEvent( new Event( 'resize' ) );

				sinon.assert.calledTwice( attachToSpy );
				sinon.assert.calledWith( attachToSpy.lastCall, { target, limiter } );
			} );

			it( 'should stop attaching when the balloon is hidden', () => {
				view.pin( { target, limiter } );

				sinon.assert.calledOnce( attachToSpy );

				view.hide();

				window.dispatchEvent( new Event( 'resize' ) );
				window.dispatchEvent( new Event( 'scroll' ) );

				// Still once.
				sinon.assert.calledOnce( attachToSpy );
			} );

			it( 'should stop attaching once the view is destroyed', () => {
				view.pin( { target, limiter } );

				sinon.assert.calledOnce( attachToSpy );

				return view.destroy().then( () => {
					view = null;

					window.dispatchEvent( new Event( 'resize' ) );
					window.dispatchEvent( new Event( 'scroll' ) );

					// Still once.
					sinon.assert.calledOnce( attachToSpy );
				} );
			} );

			it( 'should set document.body as the default limiter', () => {
				view.pin( { target } );

				sinon.assert.calledOnce( attachToSpy );

				document.body.dispatchEvent( new Event( 'scroll' ) );

				sinon.assert.calledTwice( attachToSpy );
			} );

			it( 'should work for Range as a target', () => {
				const element = document.createElement( 'div' );
				const range = document.createRange();

				element.appendChild( document.createTextNode( 'foo bar' ) );
				document.body.appendChild( element );
				range.selectNodeContents( element );

				view.pin( { target: range } );

				sinon.assert.calledOnce( attachToSpy );

				element.dispatchEvent( new Event( 'scroll' ) );

				sinon.assert.calledTwice( attachToSpy );
			} );

			it( 'should work for rect as a target', () => {
				// Just check if this normally works without errors.
				const rect = {};

				view.pin( { target: rect, limiter } );

				sinon.assert.calledOnce( attachToSpy );

				limiter.dispatchEvent( new Event( 'scroll' ) );

				sinon.assert.calledTwice( attachToSpy );
			} );
		} );

		describe( 'unpin()', () => {
			it( 'should not hide the balloon if pinned', () => {
				const hideSpy = sinon.spy( view, 'hide' );

				view.pin( { target, limiter } );
				view.unpin();

				sinon.assert.notCalled( hideSpy );
			} );

			it( 'should stop attaching', () => {
				view.pin( { target, limiter } );
				sinon.assert.calledOnce( attachToSpy );

				view.unpin();

				view.hide();
				window.dispatchEvent( new Event( 'resize' ) );
				document.dispatchEvent( new Event( 'scroll' ) );
				view.show();
				window.dispatchEvent( new Event( 'resize' ) );
				document.dispatchEvent( new Event( 'scroll' ) );

				sinon.assert.calledOnce( attachToSpy );
			} );
		} );
	} );
} );

function mockBoundingBox( element, data ) {
	const boundingBox = Object.assign( {}, data );

	boundingBox.right = boundingBox.left + boundingBox.width;
	boundingBox.bottom = boundingBox.top + boundingBox.height;

	testUtils.sinon.stub( element, 'getBoundingClientRect' ).returns( boundingBox );
}
