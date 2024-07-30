import gsap from "gsap"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import { Observer } from "gsap/Observer"

const breakpoints = (() => {
	let style = getComputedStyle(document.documentElement)

	return {
		mobile: parseInt(style.getPropertyValue("--mobile")),
		tablet: parseInt(style.getPropertyValue("--tablet")),
		laptop: parseInt(style.getPropertyValue("--laptop"))
	}
})()


document.addEventListener('DOMContentLoaded', function () {
	gsap.registerPlugin(ScrollToPlugin)
	gsap.registerPlugin(Observer)

	gsap.to(window, {
		scrollTo: "start"
	})

	/**
	 * @type NodeListOf<HTMLElement>
	 */
	let targets = document.querySelectorAll(".timeline__section")
	let currentIndex = 0
	let currentItem = targets.item(currentIndex)
	let watchDevice = matchMedia(`(max-width: ${breakpoints.mobile}px)`)
	let isMobile = watchDevice.matches
	let timeline = document.querySelector(".timeline")
	let timelineStyle = getComputedStyle(timeline)
	let inactiveWidth = timelineStyle.getPropertyValue("--section-size")
	let activeWidth = timelineStyle.getPropertyValue("--section-size-active")
	let duration = parseInt(timelineStyle.getPropertyValue("--duration"))
	let isBlocked = false
	watchDevice.addEventListener("change", () => {
		isMobile = watchDevice.matches
	})

	stopOverscroll()

	let observer = new IntersectionObserver(etnries => {
		for (const entry of etnries) {
			entry.target.classList.toggle("is-visible", entry.isIntersecting)
		}
	}, {
		threshold: [0.3],
		root: timeline
	})

	targets.forEach(test => {
		observer.observe(test)
	})

	/**
	 * 
	 * @param {HTMLElement} nextItem 
	 * @param {Number} nextIndex 
	 */
	function goNextDesktop(nextItem, nextIndex) {
		gsap.timeline({
			defaults: {
				duration: duration
			}
		}).to(nextItem, {
			width: activeWidth,
		}, "<").to(currentItem, {
			opacity: 0,
			transform: `translateX(100%)`
		}, "<").to(timeline, {
			scrollTo: nextItem,
			onComplete: () => {
				currentIndex = nextIndex
				currentItem = nextItem
				isBlocked = false
			}
		}, "<")
	}

	/**
	 * 
	 * @param {HTMLElement} nextItem 
	 * @param {Number} nextIndex 
	 */
	function goPrevDesktop(nextItem, nextIndex) {
		gsap.timeline({
			defaults: {
				duration: duration
			}
		}).to(nextItem, {
			opacity: 1,
			transform: `translateX(0%)`,
			width: activeWidth
		}, "<").to(currentItem, {
			width: inactiveWidth,
		}, "<").to(timeline, {
			scrollTo: {
				x: nextItem.offsetLeft
			},
			onComplete: () => {
				currentIndex = nextIndex
				currentItem = nextItem
				isBlocked = false
			}
		}, "<")
	}

	function goBothMobile(nextItem, nextIndex) {
		isBlocked = true
		gsap.to(timeline, {
			scrollTo: nextItem,
			duration: duration,
			onComplete: () => {
				currentIndex = nextIndex
				isBlocked = false
			}
		})
	}

	function scoll(scrollDelta, isDragging) {
		gsap.to(timeline, {
			scrollTo: `+=${scrollDelta}`,
			duration: isDragging ? 0 : Math.abs(scrollDelta / 100),
		})
	}

	function scrollTo(nextItem, nextIndex) {
		isBlocked = true

		gsap.to(timeline, {
			scrollTo: nextItem
		}).then(() => {
			currentIndex = nextIndex
			isBlocked = false
		})
	}

	function resetAll() {
		gsap.to(targets, {
			width: inactiveWidth,
			opacity: 1,
			transform: `translateX(0%)`,
		})
		targets.forEach(target => {
			target.classList.remove("is-active")
		})
	}

	function years() {
		let yearsButtons = document.querySelectorAll(".years__year")
		let yearsHeaders = document.querySelectorAll(".timeline__section--start")

		yearsButtons.forEach((currentButton, index) => {
			currentButton.addEventListener("click", () => {
				if (!isBlocked) {
					let nextItem = yearsHeaders.item(index)
					let nextIndex = [...targets].findIndex(section => nextItem == section)
					if (isMobile) {
						scrollTo(nextItem, nextIndex)
					} else {
						if (nextIndex > currentIndex) {
							isBlocked = true
							goNextDesktop(nextItem, nextIndex)
						} else if (nextIndex < currentIndex) {
							isBlocked = true
							resetAll()
							goPrevDesktop(nextItem, nextIndex)
						}
					}
					yearsButtons.forEach(button => {
						button.classList.toggle("is-active", button == currentButton)
					})
				}
			})
		})
	}

	Observer.create({
		preventDefault: true,
		target: timeline,
		lockAxis: true,
		onChange: (self) => {
			if (!isBlocked) {
				let scrollDelta = self.deltaY ? self.deltaY : self.deltaX
				// если перетягивание свайпом
				if (window.TouchEvent && self.event instanceof TouchEvent) {
					scrollDelta *= -1
					if (!isMobile) {
						scrollDelta = -self.deltaX
					}
				}
				// если перетягивание зажатым курсором а не свайпом	
				else if (self.isDragging && window.TouchEvent && !(self.event instanceof TouchEvent)) {
					scrollDelta = isMobile ? -self.deltaY : -self.deltaX
				}

				let direction = Math.sign(scrollDelta)
				let nextIndex = limitNimber(0, currentIndex + direction, targets.length - 1)
				let nextItem = targets.item(nextIndex)


				if (nextItem != currentItem && !isMobile) {
					isBlocked = true
					nextItem.classList.add("is-active")
					currentItem.classList.remove("is-active")

					if (direction > 0) {
						goNextDesktop(nextItem, nextIndex)
					} else {
						goPrevDesktop(nextItem, nextIndex)
					}
				} else {
					if (nextItem.classList.contains("is-visible")) {
						goBothMobile(nextItem, nextIndex)
					} else {
						scoll(scrollDelta, self.isDragging)
					}
				}
			}
		}
	})

	years()
})

function limitNimber(min, target, max) {
	return Math.max(min, Math.min(target, max))
}

function stopOverscroll(element) {
	element = gsap.utils.toArray(element)[0] || window;
	(element === document.body || element === document.documentElement) &&
		(element = window)
	let lastScroll = 0,
		lastTouch,
		forcing,
		forward = true,
		isRoot = element === window,
		scroller = isRoot ? document.scrollingElement : element,
		ua = window.navigator.userAgent + "",
		getMax = isRoot
			? () => scroller.scrollHeight - window.innerHeight
			: () => scroller.scrollHeight - scroller.clientHeight,
		addListener = (type, func) =>
			element.addEventListener(type, func, { passive: false }),
		revert = () => {
			scroller.style.overflowY = "auto"
			forcing = false
		},
		kill = () => {
			forcing = true
			scroller.style.overflowY = "hidden"
			!forward && scroller.scrollTop < 1
				? (scroller.scrollTop = 1)
				: (scroller.scrollTop = getMax() - 1)
			setTimeout(revert, 1)
		},
		handleTouch = (e) => {
			let evt = e.changedTouches ? e.changedTouches[0] : e,
				forward = evt.pageY <= lastTouch
			if (
				((!forward && scroller.scrollTop <= 1) ||
					(forward && scroller.scrollTop >= getMax() - 1)) &&
				e.type === "touchmove"
			) {
				e.preventDefault()
			} else {
				lastTouch = evt.pageY
			}
		},
		handleScroll = (e) => {
			if (!forcing) {
				let scrollTop = scroller.scrollTop
				forward = scrollTop > lastScroll
				if (
					(!forward && scrollTop < 1) ||
					(forward && scrollTop >= getMax() - 1)
				) {
					e.preventDefault()
					kill()
				}
				lastScroll = scrollTop
			}
		}
	if ("ontouchend" in document && !!ua.match(/Version\/[\d\.]+.*Safari/)) {
		addListener("scroll", handleScroll)
		addListener("touchstart", handleTouch)
		addListener("touchmove", handleTouch)
	}
	scroller.style.overscrollBehavior = "none"
}